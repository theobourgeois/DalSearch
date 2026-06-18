import { GoogleGenerativeAI } from "@google/generative-ai";
import { instructors, terms } from "./course-utils";
import { Term } from "./types";

type CourseEmbeddings = Record<string, number[]>;

let cachedEmbeddings: CourseEmbeddings | null = null;

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function loadEmbeddings(): Promise<CourseEmbeddings> {
    if (cachedEmbeddings) return cachedEmbeddings;
    const data = await import("../../database/course-embeddings.json");
    cachedEmbeddings = data.default as CourseEmbeddings;
    return cachedEmbeddings;
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function retrieveCourses(query: string, topK = 8): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

    const [embeddings, queryResult] = await Promise.all([
        loadEmbeddings(),
        embeddingModel.embedContent(query),
    ]);

    const queryVec = queryResult.embedding.values;

    const topCourses = Object.entries(embeddings)
        .map(([code, vec]) => ({ code, score: cosineSimilarity(queryVec, vec) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    // Import courses dynamically to avoid bundling the large JSON at module level
    const { courses } = await import("./course-utils");

    return topCourses
        .map(({ code }) => {
            const course = courses[code as keyof typeof courses];
            if (!course) return "";

            const allInstructors = Object.values(course.instructorsByTerm).flat();
            const uniqueInstructors = [...new Set(allInstructors)].filter((n) => n !== "Staff");
            const profInfo = uniqueInstructors.map((name) => {
                const rmp = instructors[name.trim() as keyof typeof instructors];
                return rmp
                    ? `${name} — ${rmp.overallRating}/5, difficulty ${rmp.difficultyLevel}/5, ${rmp.takeAgainRating} take again (${rmp.numberOfRatings} ratings)`
                    : name;
            });

            const availableTerms = [...new Set(course.termClasses.map((tc) => tc.term))].map(
                (t) => terms[t as Term] ?? t
            );

            return [
                `**${code} - ${course.title}** (${course.creditHours} credits)`,
                `Description: ${stripHtml(course.description).slice(0, 300)}`,
                course.prerequisites?.length
                    ? `Prerequisites: ${course.prerequisites.join(", ")}`
                    : "No prerequisites",
                profInfo.length ? `Instructors: ${profInfo.join(" | ")}` : "Instructor: TBA",
                `Available: ${availableTerms.join(", ") || "TBA"}`,
                `Enrollment: ${course.enrollement ?? "N/A"}`,
            ]
                .filter(Boolean)
                .join("\n");
        })
        .filter(Boolean)
        .join("\n\n---\n\n");
}
