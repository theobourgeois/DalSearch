/**
 * Get dal courses from the academic time table
 * Scrape the course description from the academic calendar
 * run with node scripts/processing.js src/utils/search.json -d <-- to get descriptions
 */
import fs from "fs";
import * as cheerio from "cheerio";

export const courseCodes = [
    "ACAD",
    "ACSC",
    "AGRI",
    "AGRN",
    "ANAT",
    "ANSC",
    "APSC",
    "AQUA",
    "ARBC",
    "ARCH",
    "ARTS",
    "ASSC",
    "BIOC",
    "BIOE",
    "BIOL",
    "BIOA",
    "BMNG",
    "BVSC",
    "BAFD",
    "BUSS",
    "BUSI",
    "CANA",
    "CHEE",
    "CHEM",
    "CHMA",
    "CHIN",
    "CIVL",
    "CLAS",
    "COMM",
    "CMSD",
    "CPST",
    "CSCA",
    "CSCI",
    "CTMP",
    "CRWR",
    "DEHY",
    "DENT",
    "DMUT",
    "DGIN",
    "DISM",
    "EMSP",
    "EESC",
    "ERTH",
    "ECON",
    "ECOA",
    "ECED",
    "ECMM",
    "ENGI",
    "INWK",
    "ENGM",
    "ENGN",
    "ENGL",
    "ENSL",
    "EGLA",
    "ENVA",
    "ENVE",
    "ENVS",
    "ENVI",
    "EPAH",
    "EURO",
    "EXTE",
    "FILM",
    "FIGS",
    "FOSC",
    "FOOD",
    "FREN",
    "GWST",
    "GENE",
    "GEOG",
    "GERM",
    "HESA",
    "HINF",
    "HLTH",
    "HPRO",
    "HSCE",
    "HAHP",
    "HSTC",
    "HIST",
    "HORT",
    "INDG",
    "IENG",
    "INFO",
    "INFB",
    "INTE",
    "INTD",
    "INTA",
    "IPHE",
    "ITAL",
    "JPHD",
    "JOUR",
    "KINE",
    "KING",
    "LARC",
    "LAWS",
    "LJSO",
    "LEIS",
    "MRIT",
    "MGMT",
    "MGTA",
    "MARA",
    "MARI",
    "MATL",
    "MATH",
    "MTHA",
    "MECH",
    "MNSC",
    "MEDP",
    "MEDR",
    "MICI",
    "MCRA",
    "MINE",
    "MUSC",
    "NESC",
    "NUMT",
    "NURS",
    "NUTR",
    "OCCU",
    "OCEA",
    "ORAL",
    "PHDP",
    "PATH",
    "PERF",
    "PERI",
    "PHAC",
    "PHAR",
    "PHIL",
    "PHLA",
    "MPAS",
    "PHYC",
    "PHYS",
    "PHYL",
    "PHYT",
    "PLAN",
    "PLSC",
    "POLI",
    "PGPH",
    "PEAS",
    "PSYR",
    "PSYO",
    "PSYC",
    "PUAD",
    "RADT",
    "REGN",
    "RELS",
    "RESM",
    "RSPT",
    "RUSN",
    "SCIE",
    "SLWK",
    "SOSA",
    "SOCI",
    "SOIL",
    "SPAN",
    "SPNA",
    "SPEC",
    "STAT",
    "STAA",
    "SUST",
    "THEA",
    "TYPR",
    "VTEC",
    "VISC",
    "WPUB",
];

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

export async function getAcademicCalendar() {
    const data = {};

    for (const code of courseCodes) {
        const payload = {
            crse_numb: null,
            page_num: "1",
            offset: "0",
            terms: "202510;202520",
            page_size: "9999",
            max: "1000",
            subj_code: code,
            districts: "100;200;300;400;",
        };

        const params = { ...encodeText(payload), encoded: "true" };
        url.search = new URLSearchParams(params).toString();

        try {
            const response = await fetch(url.toString(), {
                method: "GET",
                headers,
            });

            console.log(
                `------ [FETCHING COURSES WITH SUBJECT: (${code})] ------`
            );
            const json = await response.json();
            data[code] = json;
        } catch (error) {
            console.error(error);
        }
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

async function main() {
    const academicCalendar = await getAcademicCalendar();
    const courses = transformAcademicCalendar(academicCalendar);

    let previousCourses = fs.readFileSync("search-data.json", "utf8");
    previousCourses = JSON.parse(previousCourses);

    let newCourses = replaceClassesAndInstructors(previousCourses, courses);

    const args = process.argv.slice(2);
    const outputFilename = args[0] || "search.json";
    const getDescriptions = args[1] === "-d";

    if (getDescriptions) {
        console.log("------ [FETCHING DESCRIPTIONS] ------");
        newCourses = await fillInMissingData(newCourses);
    }

    writeToFile(newCourses, outputFilename);
}

// replace course1 classes and instructors with course2 classes and instructors
function replaceClassesAndInstructors(courses1, courses2) {
    const newCourses = { ...courses2 };

    for (const course in newCourses) {
        newCourses[course].description = courses1[course]?.description || "";
    }

    return newCourses;
}

function merge(courses1, courses2) {
    const newCourses = { ...courses1 };

    for (const course in newCourses) {
        const newTermClasses = courses1[course].termClasses;
        const oldTermClasses = courses2[course]?.termClasses || [];
        newCourses[course].termClasses = [...newTermClasses, ...oldTermClasses];
        const newInstructorsByTerm = courses1[course].instructorsByTerm;
        const oldInstructorsByTerm = courses2[course]?.instructorsByTerm || {};
        for (const term in oldInstructorsByTerm) {
            if (!newInstructorsByTerm[term]) {
                newInstructorsByTerm[term] = [];
            }
            newInstructorsByTerm[term].push(...oldInstructorsByTerm[term]);
        }

        newCourses[course].instructorsByTerm = newInstructorsByTerm;
    }

    const filtedCourse2Keys = Object.keys(courses2).filter(
        (course) => !Object.keys(newCourses).includes(course)
    );

    for (const course of filtedCourse2Keys) {
        newCourses[course] = courses2[course];
    }

    return newCourses;
}

function writeToFile(data, filename = "data.json") {
    fs.writeFile(filename, JSON.stringify(data), (err) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`------ [FILE CREATED ${filename}] ------`);
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
    const codes = Object.keys(courses);
    const promises = [];
    const newCourses = { ...courses };

    let i = 0;
    for (const code of codes) {
        /** @type {Course} */
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
                const mainContent = $(".maincontent").html();

                console.log(
                    `------ [${i}: FETCHING DESCRIPTION FOR COURSE: ${code}] ------`
                );
                i++;

                const desc = mainContent
                    .split("CREDIT HOURS")[1]
                    .split("<br>")[1]
                    .trim();
                const prerequisites = getPreReqs(mainContent, newCourses);

                newCourses[code].description = desc;
                newCourses[code].prerequisites = prerequisites;
            } catch (error) {
                console.error(
                    `Failed to fetch data for course ${code}:`,
                    error
                );
            }
        };

        promises.push(promise);
    }

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

/**
 * @param {CourseDetailsByCourseCode} timetableBySubjectCode
 * @returns {Course[]}
 * */
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

main(); //
