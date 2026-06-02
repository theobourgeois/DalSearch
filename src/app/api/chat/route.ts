import { GoogleGenerativeAI, FunctionCallingMode, SchemaType, Part } from "@google/generative-ai";
import {
    courses,
    instructors,
    terms,
    subjects,
    creditHours as allCreditHours,
    getFilteredCourses,
} from "@/lib/course-utils";
import { CourseFilter, CourseOrderBy, Term } from "@/lib/types";

const courseList = Object.values(courses);

function stripHtml(html: string) {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function searchCourses(
    query: string,
    subjectCode?: string,
    courseLevel?: string,
    term?: string,
) {
    const filter: CourseFilter = {
        terms: term ? [term as Term] : (Object.keys(terms) as Term[]),
        courseLevels: courseLevel ? [courseLevel] : ["1000", "2000", "3000", "4000", "5000", "6000", "7000", "8000", "9000"],
        subjectCodes: subjectCode ? [subjectCode.toUpperCase()] : subjects.map((s) => s.code),
        searchTerm: query ?? "",
        creditHours: allCreditHours,
    };
    const orderBy: CourseOrderBy = { key: "title", direction: "asc" };
    const results = getFilteredCourses(courseList, filter, orderBy, 8);

    return results.map((course) => {
        const allInstructors = Object.values(course.instructorsByTerm).flat();
        const uniqueInstructors = [...new Set(allInstructors)].filter((n) => n !== "Staff");
        const profInfo = uniqueInstructors.map((name) => {
            const rmp = instructors[name.trim()];
            if (rmp) {
                return `${name} — Rating: ${rmp.overallRating}/5, Difficulty: ${rmp.difficultyLevel}/5, Would take again: ${rmp.takeAgainRating} (${rmp.numberOfRatings} ratings)`;
            }
            return name;
        });

        return {
            code: course.subjectCode + course.courseCode,
            title: course.title,
            creditHours: course.creditHours,
            description: stripHtml(course.description).slice(0, 300),
            prerequisites: course.prerequisites,
            instructors: profInfo,
            availableTerms: [...new Set(course.termClasses.map((tc) => tc.term))].map(
                (t) => terms[t as Term] ?? t,
            ),
            enrollment: course.enrollement,
        };
    });
}

function getCourseDetails(courseCode: string) {
    const course = courses[courseCode.toUpperCase() as keyof typeof courses];
    if (!course) return { error: `Course ${courseCode} not found` };

    const allInstructors = Object.values(course.instructorsByTerm).flat();
    const uniqueInstructors = [...new Set(allInstructors)].filter((n) => n !== "Staff");
    const profInfo = uniqueInstructors.map((name) => {
        const rmp = instructors[name.trim()];
        if (rmp) {
            return {
                name,
                overallRating: rmp.overallRating,
                difficultyLevel: rmp.difficultyLevel,
                takeAgainRating: rmp.takeAgainRating,
                numberOfRatings: rmp.numberOfRatings,
                profileLink: rmp.rateMyProfLink,
            };
        }
        return { name, noRatingsAvailable: true };
    });

    return {
        code: course.subjectCode + course.courseCode,
        title: course.title,
        creditHours: course.creditHours,
        description: stripHtml(course.description),
        prerequisites: course.prerequisites,
        equivalent: course.equivalent,
        instructors: profInfo,
        schedule: course.termClasses.map((tc) => ({
            term: terms[tc.term as Term] ?? tc.term,
            type: tc.type,
            days: tc.days,
            time: `${tc.time.start} - ${tc.time.end}`,
            location: tc.location,
            section: tc.section,
        })),
        enrollment: course.enrollement,
    };
}

const SYSTEM_PROMPT = `You are DalBot, a friendly course advisor AI for Dalhousie University students. You help students discover and choose the right courses using real-time data from DalSearch.

You can:
- Search for courses by topic, subject, level, or term
- Show professor ratings (from RateMyProfessors) including overall rating, difficulty, and % who would take again
- Explain prerequisites and course details
- Recommend courses based on interests, year level, or schedule preferences

Available terms: ${Object.entries(terms).map(([code, name]) => `${name} (code: ${code})`).join(", ")}.
Available subject codes include: CSCI, MATH, BIOL, CHEM, PHYS, MGMT, ECON, ENGL, PSYC, and many more.

Guidelines:
- Be concise and friendly
- Always include course code, title, credit hours, and prof ratings when listing courses
- Mention prerequisites if they exist
- If a student seems overwhelmed, suggest starting with 1000 or 2000 level courses
- Format course lists cleanly`;

export async function POST(request: Request) {
    if (!process.env.GEMINI_API_KEY) {
        return Response.json({ response: "AI advisor is not configured. Please add a GEMINI_API_KEY to the environment." }, { status: 500 });
    }

    const { messages } = await request.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite-preview",
        systemInstruction: SYSTEM_PROMPT,
        tools: [
            {
                functionDeclarations: [
                    {
                        name: "search_courses",
                        description: "Search for Dalhousie courses by keyword, subject, level, or term. Use this whenever a student asks about finding, discovering, or listing courses.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                query: {
                                    type: SchemaType.STRING,
                                    description: "Search keyword — a topic, course name, or empty string to browse by subject/level",
                                },
                                subjectCode: {
                                    type: SchemaType.STRING,
                                    description: "Department subject code, e.g. CSCI, MATH, BIOL, MGMT, ECON",
                                },
                                courseLevel: {
                                    type: SchemaType.STRING,
                                    description: "Level of the course: 1000, 2000, 3000, or 4000",
                                },
                                term: {
                                    type: SchemaType.STRING,
                                    description: `Term code to filter by: ${Object.keys(terms).join(", ")}`,
                                },
                            },
                        },
                    },
                    {
                        name: "get_course_details",
                        description: "Get full details about a specific course including its schedule, professor ratings, prerequisites, and enrollment.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                courseCode: {
                                    type: SchemaType.STRING,
                                    description: "Full course code, e.g. CSCI2122, MATH1000, BIOL1010",
                                },
                            },
                            required: ["courseCode"],
                        },
                    },
                ],
            },
        ],
        toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
    });

    const allButLast = messages.slice(0, -1);
    // Gemini requires history to start with a user turn — drop any leading assistant messages
    const firstUserIdx = allButLast.findIndex((m: { role: string }) => m.role === "user");
    const history = (firstUserIdx === -1 ? [] : allButLast.slice(firstUserIdx)).map(
        (msg: { role: string; content: string }) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
        })
    );

    const lastMessage = messages[messages.length - 1].content;
    const chat = model.startChat({ history });

    let currentParts: string | Part[] = lastMessage;

    try {
        // Loop to handle chained function calls
        for (let i = 0; i < 5; i++) {
            const response = await chat.sendMessage(currentParts);
            const functionCalls = response.response.functionCalls();

            if (!functionCalls?.length) {
                return Response.json({ response: response.response.text() });
            }

            const functionResults: Part[] = functionCalls.map((call) => {
                let result;
                const args = call.args as Record<string, string>;
            if (call.name === "search_courses") {
                    result = searchCourses(
                        args.query ?? "",
                        args.subjectCode,
                        args.courseLevel,
                        args.term,
                    );
                } else if (call.name === "get_course_details") {
                    result = getCourseDetails(args.courseCode);
                } else {
                    result = { error: "Unknown function" };
                }

                return {
                    functionResponse: {
                        name: call.name,
                        response: { result },
                    },
                };
            });

            currentParts = functionResults;
        }

        return Response.json({ response: "I had trouble fetching the course data. Please try again." });
    } catch (error) {
        console.error("Chat error:", error);
        return Response.json({ response: "Something went wrong. Please try again." }, { status: 500 });
    }
}
