/**
 * Get dal courses from the academic time table
 * Scrape the course description from the academic calendar
 * run with node scripts/processing.js src/utils/search.json -d <-- to get descriptions
 */
import fs from "fs";
import * as cheerio from "cheerio";

const headers = {
    accept: "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    cookie: "JSESSIONID=393EAF377B6BC59D4E08D33A5A7076F7; IDMSESSID=039DFBC70A6BA68EFD9E3256A61DB4CF1C46C64E023E0C880B8C830D911CCFF494EAA73BD3CCE51ED0EA0C9B8E0A682B",
    Referer:
        "https://self-service.dal.ca/BannerExtensibility/customPage/page/dal.stuweb_academicTimetable",
    "Referrer-Policy": "strict-origin-when-cross-origin",
};

const url = new URL(
    "https://self-service.dal.ca/BannerExtensibility/internalPb/virtualDomains.dal_stuweb_academicTimetable"
);

export async function getAcademicCalendar(subjectCodes) {
    const data = {};
    let i = 1;
    for (const code of subjectCodes) {
        const payload = {
            crse_numb: null,
            page_num: "1",
            offset: "0",
            terms: "202510;202520",
            page_size: "9999",
            max: "1000",
            subj_code: code.code,
            districts: "100;200;300;400;",
        };

        const params = { ...encodeText(payload), encoded: "true" };
        url.search = new URLSearchParams(params).toString();

        try {
            const response = await fetch(url.toString(), {
                method: "GET",
                headers,
            });

            const json = await response.json();
            console.log(
                `------ [${i}/${subjectCodes.length}: FETCHING COURSES WITH SUBJECT: ${code.description}, Courses: ${json.length}] ------`
            );
            data[code.code] = json;
        } catch (error) {
            console.error(error);
        }
        i++;
    }

    return data;
}

export function encodeText(obj) {
    // Fixed lengths for each key and value
    const lengths = {
        crse_numb: { keyLength: "14", valueLength: "69" },
        page_num: { keyLength: "18", valueLength: "16" },
        offset: { keyLength: "31", valueLength: "13" },
        terms: { keyLength: "35", valueLength: "94" },
        page_size: { keyLength: "38", valueLength: "53" },
        max: { keyLength: "58", valueLength: "81" },
        subj_code: { keyLength: "60", valueLength: "6" },
        districts: { keyLength: "74", valueLength: "69" },
    };

    const encodedResults = {};

    // Convert object to encoded string
    Object.entries(obj).forEach(([key, value]) => {
        // Get the predefined lengths
        const { keyLength, valueLength } = lengths[key];

        // Encode the key part
        const keyEncoded = `${btoa(keyLength)}${btoa(key)}`;

        // Encode the value part
        let valueEncoded;
        if (value === null) {
            valueEncoded = `${btoa("69")}null`;
        } else {
            valueEncoded = `${btoa(valueLength)}${btoa(String(value))}`;
        }

        encodedResults[keyEncoded] = valueEncoded;
    });

    return encodedResults;
}

function replaceClassesAndInstructors(prevCourses, newCourses) {
    const newCourses = { ...newCourses };

    for (const course in newCourses) {
        newCourses[course].description = prevCourses[course]?.description || "";
    }

    return newCourses;
}

function writeToFile(data, filename = "data.json", append = false) {
    let func = fs.writeFileSync;
    if (append) {
        func = fs.appendFileSync;
    }
    func(filename, JSON.stringify(data), (err) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(
            `------ [FILE CREATED ${filename} at ${new Date().toISOString()}] ------`
        );
    });
}

function getPreReqs(innerHtml, courses) {
    const splitByPrereq = innerHtml.split("PREREQUISITES:");
    if (splitByPrereq.length < 2) return [];
    const prereqText = splitByPrereq[1].split("<br>")[0].trim();
    // check every course and see if it is in the prereqText
    const courseNames = Object.keys(courses);
    const prereqs = [];
    for (const course of courseNames) {
        if (
            prereqText.includes(
                courses[course].subjectCode + " " + courses[course].courseCode
            )
        ) {
            prereqs.push(course);
        }
    }

    return prereqs;
}

async function fillInMissingData(courses) {
    const dalCourseDetailsUrl =
        "https://academiccalendar.dal.ca/Catalog/ViewCatalog.aspx?pageid=viewcatalog&topicgroupid=37708&entitytype=CID&entitycode=";
    let codes = Object.keys(courses);
    // filter course that already have descriptions
    codes = codes.filter((code) => !courses[code].description);

    console.log(`------ [FETCHING ${codes.length} DESCRIPTIONS] ------`);

    const promises = [];
    const newCourses = { ...courses };

    let i = 0;
    for (const code of codes) {
        const course = courses[code];
        const url =
            dalCourseDetailsUrl + course.subjectCode + "+" + course.courseCode;

        const promise = async () => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    console.error(
                        `Failed to fetch data for course ${code}:`,
                        response.statusText
                    );
                    return;
                }

                const html = await response.text();
                const $ = cheerio.load(html);
                const mainContent = $(".maincontent").html() ?? "";

                const desc =
                    mainContent
                        ?.split("CREDIT HOURS")[1]
                        ?.split("<br>")[1]
                        ?.trim() ?? "";
                const prerequisites = getPreReqs(mainContent, newCourses);

                newCourses[code].description = desc;
                newCourses[code].prerequisites = prerequisites;
                console.log(
                    `------ [${i + 1}/${
                        codes.length
                    }: COURSE: ${code} - DESCRIPTION: ${desc
                        .split("")
                        .slice(0, 10)} - PREREQS: ${prerequisites.join(
                        ","
                    )}] ------`
                );
                i++;
            } catch (error) {
                console.error(
                    `Failed to fetch data for course ${code}:`,
                    error
                );
            }
        };

        promises.push(promise);
    }

    const waitTimeSeconds = codes.length * (0.5 + 0.5);
    console.log(
        "Estimated wait time: ",
        Math.floor(waitTimeSeconds / 60),
        "minutes ",
        Math.floor(waitTimeSeconds % 60),
        "seconds"
    );
    // do the promises one after another as to not overload the server
    for (const promise of promises) {
        await promise();
        // wait for 1 second
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return newCourses;
}
/**
 * @param {TimeTable} timetable
 * @returns {string[]}
 * */
function getTimetableDays(timetable) {
    const MONDAYS = timetable.MONDAYS;
    const TUESDAYS = timetable.TUESDAYS;
    const WEDNESDAYS = timetable.WEDNESDAYS;
    const THURSDAYS = timetable.THURSDAYS;
    const FRIDAYS = timetable.FRIDAYS;
    const SATURDAYS = timetable.SATURDAYS;
    return [MONDAYS, TUESDAYS, WEDNESDAYS, THURSDAYS, FRIDAYS, SATURDAYS]
        .map((day) => {
            if (!day) return null;
            return day.split("<br>").filter(Boolean)[0];
        })
        .filter(Boolean);
}

function formatTime(time) {
    if (!time) return null;
    const cleaned = time.split("<br>").filter(Boolean)[0];
    const start = cleaned.split("-")[0];
    const end = cleaned.split("-")[1];
    return {
        start,
        end,
    };
}

function getLocation(l) {
    if (!l) return null;
    const locationsSplit = l.split("<br>").filter(Boolean);

    for (const split of locationsSplit) {
        // check if first letter is a letter
        if (split[0].match(/[a-z]/i)) {
            return split;
        }
    }

    return locationsSplit;
}

function transformAcademicCalendar(timetableBySubjectCode) {
    const subjectCodes = Object.keys(timetableBySubjectCode);
    const courses = {};

    for (const code of subjectCodes) {
        /** @type {TimeTable[]} */
        const courseData = timetableBySubjectCode[code];
        for (const timetable of courseData) {
            const code = timetable.SUBJ_CODE + timetable.CRSE_NUMB;
            const subjectCode = timetable.SUBJ_CODE;
            const courseCode = timetable.CRSE_NUMB;
            const equivalent = timetable.CRSE_EQUIV;
            const title = timetable.CRSE_TITLE;
            const creditHours = timetable.CREDIT_HRS;
            const description = "";
            const location = getLocation(timetable.LOCATIONS);

            const enrollement = {
                enrolled: Number(timetable.ENRL),
                capacity: Number(timetable.MAX_ENRL),
            };

            const instructors =
                timetable.INSTRUCTORS.split("<br>").filter(Boolean);
            const instructorsByTerm = courses[code]?.instructors || {};
            instructorsByTerm[timetable.TERM_CODE] = instructors.splice(0);

            const termClasses = {
                term: timetable.TERM_CODE,
                instructors: instructors.splice(0),
                section: timetable.SEQ_NUMB,
                type: timetable.SCHD_TYPE,
                days: getTimetableDays(timetable),
                time: formatTime(timetable.TIMES),
                location,
                crn: timetable.CRN,
                course: code,
            };

            const course = {
                prerequisites: [],
                equivalent,
                subjectCode,
                courseCode,
                title,
                creditHours,
                description,
                termClasses: [],
                location,
                enrollement,
            };

            if (!courses[code]) {
                courses[code] = course;
                courses[code].termClasses.push(termClasses);
                courses[code].instructorsByTerm = instructorsByTerm;
            } else {
                courses[code].termClasses.push(termClasses);
                Object.keys(instructorsByTerm).forEach((term) => {
                    if (!courses[code].instructorsByTerm[term]) {
                        courses[code].instructorsByTerm[term] = [];
                    }
                    courses[code].instructorsByTerm[term].push(
                        ...instructorsByTerm[term]
                    );
                });
            }
        }
    }

    return courses;
}

function logDifferences(prevCourses, newCourses) {
    const data = {};
    const prevCodes = Object.keys(prevCourses);
    const newCodes = Object.keys(newCourses);
    data.DATE_ADDED = new Date().toISOString();
    data.COURSES = {};

    for (const code of prevCodes) {
        if (!newCourses[code]) {
            data.COURSES[code] = "REMOVED";
        } else {
            if (
                prevCourses[code].description !== newCourses[code].description
            ) {
                data.COURSES[code] = "DESCRIPTION CHANGED";
            }
        }
    }

    for (const code of newCodes) {
        if (!prevCourses[code]) {
            data.COURSES[code] = "ADDED";
        }
    }

    writeToFile(data, "differences.json", true);
}
async function getSubjectCodes() {
    try {
        const res = await fetch(
            "https://self-service.dal.ca/BannerExtensibility/internalPb/virtualDomains.dal_stuweb_academicTimetable_subjects?MzA%3DdGVybXM%3D=ODE%3DMjAyNTAwOzIwMjQzMDsyMDI1MTA7MjAyNTIwOw%3D%3D&Mzk%3DZGlzdHJpY3Rz=OTk%3DMTAwOzIwMDszMDA7NDAwOw%3D%3D&encoded=true",
            {
                headers: {
                    accept: "application/json, text/plain, */*",
                    "accept-language": "en-US,en;q=0.9",
                    "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"macOS"',
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    cookie: "JSESSIONID=7AAB3A11B5B1C0825AF4EFED532B9672; IDMSESSID=1A874AB26C4FC35A8F8817B7BE83ED7671DFA2B9DA5CBE2DF861F92920747D45ED13918376FF64BCDFDB89D3C1A5FB8D",
                    Referer:
                        "https://self-service.dal.ca/BannerExtensibility/customPage/page/dal.stuweb_academicTimetable",
                    "Referrer-Policy": "strict-origin-when-cross-origin",
                },
                body: null,
                method: "GET",
            }
        );
        const data = await res.json();
        const transformed = data.map(({ CODE, DESCR }) => ({
            code: CODE,
            description: DESCR,
        }));

        console.log(`------ [TOTAL SUBJECTS: ${transformed.length}] ------`);
        return transformed;
    } catch (error) {
        console.error(error);
    }
}

async function main() {
    const subjectCodes = await getSubjectCodes();
    const args = process.argv.slice(2);
    const getDescriptions = args[1] === "-d";
    const outputFileDir = args[0] || "../utils/";

    writeToFile(subjectCodes, outputFileDir + "subjects.json");

    const academicCalendar = await getAcademicCalendar(subjectCodes);
    const courses = transformAcademicCalendar(academicCalendar);

    console.log(
        `------ [TOTAL COURSES: ${Object.keys(courses).length}] ------`
    );

    const outputFile = outputFileDir + "search.json";
    let previousCourses = fs.readFileSync(outputFile, "utf8");
    previousCourses = JSON.parse(previousCourses);

    // use old course descriptions in case you dont want to fetch them again
    let newCourses = replaceClassesAndInstructors(previousCourses, courses);

    if (getDescriptions) {
        newCourses = await fillInMissingData(newCourses);
    }

    writeToFile(newCourses, outputFile);
    logDifferences(previousCourses, newCourses);
}

main();
