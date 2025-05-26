/**
 * Get dal courses from the academic time table
 * Scrape the course description from the academic calendar
 * run with node scripts/processing.js src/utils/search.json -d <-- to get descriptions
 */
import fs from "fs";
import * as cheerio from "cheerio";

let logResult = "";

function log(...args) {
    const logString = args.map((a) => JSON.stringify(a)).join(" ");
    console.log(logString);
    logResult += logString + "\n";
}

const TERMS = ["202530", "202610", "202620"];

const headers = {
    accept: "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    connection: "keep-alive",
    dnt: "1",
    "sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    cookie: "JSESSIONID=E1566922AA653813CE71EB4679D241C2; _gcl_au=1.1.580803882.1744254955; _fbp=fb.1.1744254955265.730511166965673439; _tt_enable_cookie=1; _ttp=01JREV4VRYK92Y33KTTWM123DK_.tt.1; _ga_BLWEGK0R1R=GS1.1.1744657797.1.0.1744657797.0.0.0; _ga=GA1.1.119927498.1744052787; _ga_7D4LH7N6V9=GS1.1.1744745259.1.0.1744745263.0.0.0; _clck=b2mztl%7C2%7Cfv8%7C0%7C1926; ttcsid=1745164968296.4.1745164968296; ttcsid_C7PAQE240CK6SQS6AP0G=1745164968296.4.1745164968504; _ga_10ZKDM5ZR2=GS1.1.1745164968.6.0.1745164986.0.0.0; _ga_03M7E9DG13=GS1.1.1745164968.6.0.1745164986.0.0.0; _ga_ZNSTZ2YGVJ=GS1.1.1745164983.4.1.1745164986.0.0.0; AMCVS_4D6368F454EC41940A4C98A6%40AdobeOrg=1; AMCV_4D6368F454EC41940A4C98A6%40AdobeOrg=179643557%7CMCIDTS%7C20216%7CMCMID%7C39502886977980966309139359136784396509%7CMCAID%7CNONE%7CMCOPTOUT-1746640284s%7CNONE%7CvVersion%7C5.5.0; IDMSESSID=69261E553839145758BA144DF8000823776862F86EA4C100433F7BEB17286C02AD10BF155BAEC19E5249AC665C600D8C",
    "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    Referer:
        "https://self-service.dal.ca/BannerExtensibility/customPage/page/dal.stuweb_academicTimetable",
    "Referrer-Policy": "strict-origin-when-cross-origin",
};

// const url = new URL(
//     "https://self-service.dal.ca/BannerExtensibility/internalPb/virtualDomains.dal_stuweb_academicTimetable"
// );

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
            terms: TERMS.join(";"),
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
            log(
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
        crse_numb: { keyLength: "64", valueLength: "68" }, // From website: Key: 64, Value for null: 68
        page_num: { keyLength: "45", valueLength: "14" }, // From website: Key: 45, Value for "1": 14
        offset: { keyLength: "11", valueLength: "14" }, // From website: Key: 11, Value for "0": 14
        terms: { keyLength: "19", valueLength: "51" }, // From website: Key: 19, Value for "202530;" (single term): 51
        page_size: { keyLength: "77", valueLength: "12" }, // From website: Key: 77, Value for "9999": 12
        max: { keyLength: "60", valueLength: "96" }, // From website: Key: 60, Value for "1000": 96
        subj_code: { keyLength: "55", valueLength: "33" }, // From website: Key: 55, Value for "AGRI" (base64): 33
        districts: { keyLength: "36", valueLength: "30" }, // From website: Key: 36, Value for "100;200;300;400;": 30
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
    const updatedCourses = { ...newCourses };

    for (const course in newCourses) {
        updatedCourses[course].description =
            prevCourses[course]?.description || "";
        updatedCourses[course].prerequisites =
            prevCourses[course]?.prerequisites || [];
    }

    return updatedCourses;
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
        log(
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
        "https://academiccalendar.dal.ca/Catalog/ViewCatalog.aspx?pageid=viewcatalog&entitytype=CID&entitycode=";
    let codes = Object.keys(courses);
    // filter course that already have descriptions
    codes = codes.filter((code) => !courses[code].description);

    log(`------ [FETCHING ${codes.length} DESCRIPTIONS] ------`);

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
                log(
                    `------ [${i + 1}/${
                        codes.length
                    }: COURSE: ${code} - DESCRIPTION: ${desc
                        .split("")
                        .slice(0, 15)
                        .join("")}... - PREREQS: ${prerequisites.join(
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
    log(
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

        log(`------ [TOTAL SUBJECTS: ${transformed.length}] ------`);
        return transformed;
    } catch (error) {
        console.error(error);
    }
}

async function main() {
    const subjectCodes = await getSubjectCodes();
    const args = process.argv.slice(2);
    const argsAfterFirst = args.slice(1);
    const outputFileDir = args[0] || "../../database/";
    const getDescriptions = argsAfterFirst.includes("-d");
    const shouldLog = argsAfterFirst.includes("-l");
    const noCache = argsAfterFirst.includes("-no-cache");

    writeToFile(subjectCodes, outputFileDir + "subjects.json");

    const academicCalendar = await getAcademicCalendar(subjectCodes);
    const courses = transformAcademicCalendar(academicCalendar);

    log(`------ [TOTAL COURSES: ${Object.keys(courses).length}] ------`);

    const outputFile = outputFileDir + "search.json";
    let previousCourses = fs.readFileSync(outputFile, "utf8");
    previousCourses = JSON.parse(previousCourses);

    // use old course descriptions in case you dont want to fetch them again
    let newCourses = courses;
    if (!noCache) {
        newCourses = replaceClassesAndInstructors(previousCourses, courses);
    }

    if (getDescriptions) {
        newCourses = await fillInMissingData(newCourses);
    }

    writeToFile(newCourses, outputFile);

    if (shouldLog) {
        const date = new Date().toISOString();
        writeToFile(logResult, `${outputFileDir}logs/${date}.log`);
    }
}

main();
