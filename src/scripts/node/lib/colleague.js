/**
 * Ellucian Colleague Self-Service's public course catalog (".../Student/Courses"). Its course search
 * runs on JSON endpoints that work without signing in, given the session cookie and anti-forgery token
 * the search page hands out. Descriptions and requisites come with the search results. One
 * university's scraper configures this with its address; see universities/msvu.js.
 */
import { log } from "./import.js";

const USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";
const PAGE_SIZE = 100;
const CONCURRENCY = 4;
const REQUEST_DELAY_MS = 150;

/** A Self-Service session: the cookies and anti-forgery token every JSON request needs. */
async function openSession(BASE) {
    const cookies = new Map();
    const keep = (response) => {
        for (const cookie of response.headers.getSetCookie()) {
            const [pair] = cookie.split(";");
            const [name, ...value] = pair.split("=");
            cookies.set(name.trim(), value.join("="));
        }
    };
    const cookieHeader = () => [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");

    const page = await fetch(`${BASE}/courses/`, { headers: { "user-agent": USER_AGENT } });
    if (!page.ok) throw new Error(`Course search page: HTTP ${page.status}`);
    keep(page);
    const token = (await page.text()).match(/name="__RequestVerificationToken" type="hidden" value="([^"]+)"/)?.[1];
    if (!token) throw new Error("No anti-forgery token on the course search page");

    return async function request(path, body, attempts = 3) {
        for (let attempt = 1; ; attempt++) {
            try {
                const response = await fetch(`${BASE}/${path}`, {
                    method: body === undefined ? "GET" : "POST",
                    headers: {
                        "user-agent": USER_AGENT,
                        "content-type": "application/json, charset=utf-8",
                        "x-requested-with": "XMLHttpRequest",
                        __RequestVerificationToken: token,
                        cookie: cookieHeader(),
                    },
                    body: body === undefined ? undefined : JSON.stringify(body),
                });
                // Later responses can hand out a new anti-forgery cookie that no longer matches the page's
                // token, so the cookies from the search page are kept as they are.
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            } catch (error) {
                if (attempt >= attempts) throw new Error(`${path}: ${error.message}`);
                await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
            }
        }
    };
}

function searchCriteria(term, subject, pageNumber) {
    return {
        keyword: null,
        terms: [term],
        requirement: null,
        subrequirement: null,
        courseIds: null,
        sectionIds: null,
        requirementText: null,
        subrequirementText: "",
        group: null,
        startTime: null,
        endTime: null,
        openSections: null,
        subjects: [subject],
        academicLevels: [],
        courseLevels: [],
        synonyms: [],
        courseTypes: [],
        topicCodes: [],
        days: [],
        locations: [],
        faculty: [],
        onlineCategories: null,
        keywordComponents: [],
        startDate: null,
        endDate: null,
        startsAtTime: null,
        endsByTime: null,
        pageNumber,
        sortOn: "None",
        sortDirection: "Ascending",
        subjectsBadge: [],
        locationsBadge: [],
        termFiltersBadge: [],
        daysBadge: [],
        facultyBadge: [],
        academicLevelsBadge: [],
        courseTypesBadge: [],
        courseLevelsBadge: [],
        sectionStatusBadge: [],
        topicCodesBadge: [],
        onlineCategoriesBadge: [],
        openAndWaitlistedSections: null,
        searchResultsView: "CatalogListing",
        searchResultsViewAvailable: true,
        quantityPerPage: PAGE_SIZE,
    };
}

/** Every course in a term and subject, with its sections' ids and its calendar entry. */
async function searchCourses(request, term, subject) {
    const courses = [];
    for (let page = 1; ; page++) {
        const result = await request("Courses/PostSearchCriteria", searchCriteria(term, subject, page));
        courses.push(...(result.CourseFullModels ?? []));
        if (page >= (result.TotalPages ?? 1)) return courses;
    }
}

/** Runs `task` over `items` a few at a time, pausing between requests. */
async function inBatches(items, task) {
    const results = [];
    for (let start = 0; start < items.length; start += CONCURRENCY) {
        results.push(...(await Promise.all(items.slice(start, start + CONCURRENCY).map(task))));
        await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
    }
    return results;
}

/** "2026 Fall" -> Fall 2026, "2026 Summer I" -> Summer I 2026. */
function describeTerm(code, description, startsOn, endsOn) {
    const suffix = code.split("/")[1] ?? "";
    const season =
        { FA: "fall", WI: "winter", SP: "spring", S1: "summer", S2: "summer", SU: "summer" }[suffix] ?? "other";
    const label = description.replace(/^\d{4}\s+/, "").trim();
    return {
        code,
        name: `${label} ${startsOn.slice(0, 4)}`,
        season,
        year: Number(startsOn.slice(0, 4)),
        starts_on: startsOn,
        ends_on: endsOn < startsOn ? startsOn : endsOn,
    };
}

/** Colleague's days of the week, Sunday first. */
const days = ["U", "M", "T", "W", "R", "F", "S"];

/**
 * Colleague mixes the kind of class with how it's delivered ("Lecture", "Synchronous Online"), so
 * online and hybrid lectures are still lectures: a course's lecture and online sections are
 * alternatives, not two things to register in.
 */
function classify(method) {
    const text = (method ?? "").toLowerCase();
    if (/work integrated|\bwil\b/.test(text)) return { type: "WkT", kind: "work_term" };
    if (/\blab/.test(text)) return { type: "Lab", kind: "lab" };
    if (/tutorial/.test(text)) return { type: "Tut", kind: "tutorial" };
    if (/seminar/.test(text)) return { type: "Sem", kind: "seminar" };
    if (/studio/.test(text)) return { type: "Std", kind: "studio" };
    if (/practicum|placement|clinical/.test(text)) return { type: "Prac", kind: "clinical" };
    if (/co-?op|work term/.test(text)) return { type: "WkT", kind: "work_term" };
    if (/internship/.test(text)) return { type: "Int", kind: "internship" };
    if (/thesis/.test(text)) return { type: "Ths", kind: "thesis" };
    if (/field/.test(text)) return { type: "Fld", kind: "field" };
    if (/directed|independent|reading/.test(text)) return { type: "Ind", kind: "independent_study" };
    return { type: "Lec", kind: "lecture" };
}

/**
 * "Norris, D" -> "Norris D.", the same shape as Dal's timetable, so RateMyProfessors names match alike.
 * Some universities (CBU) list full names instead: "Mr. Kevin F. Deveaux" -> "Kevin Deveaux".
 */
function instructorName(name) {
    const [last, first] = name.split(",").map((part) => part.trim());
    if (!first) {
        return last
            .replace(/^(dr|prof|professor|mr|mrs|ms|mx)\.?\s+/i, "")
            .replace(/^(\S+)(\s+[A-Z]\.)+\s+(?=\S)/, "$1 ")
            .trim();
    }
    return `${last} ${first.replace(/\.$/, "")}.`;
}

/** "2026-09-09T00:00:00-03:00" -> "2026-09-09". */
const dateOf = (value) => (value ? value.slice(0, 10) : null);
/** "13:30:00" -> "13:30". */
const timeOf = (value) => (value && /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : null);

function toMeeting(meeting) {
    const start = timeOf(meeting.StartTime);
    const end = timeOf(meeting.EndTime);
    const timed = start && end && end > start;
    const online =
        meeting.IsOnline || /online/i.test(meeting.BuildingDisplay ?? "") || /ONLINE/.test(meeting.Room ?? "");
    const building = (meeting.BuildingDisplay ?? "").trim();
    const room = (meeting.RoomDisplay ?? "").trim();
    let location = null;
    let rooms = [];
    if (online) {
        const method = (meeting.InstructionalMethodDisplay ?? "")
            .toLowerCase()
            .replace(/\bonline\b/, "")
            .replace(/[()]/g, "")
            .trim();
        location = method ? `Online (${method})` : "Online";
    } else if (building) {
        location = [building, room].filter(Boolean).join(" ");
        rooms = [{ campus: null, building, room: room || null }];
    }
    return {
        days: [...new Set((meeting.Days ?? []).map((day) => days[day]).filter(Boolean))],
        start_time: timed ? start : null,
        end_time: timed ? end : null,
        location,
        rooms,
        starts_on: dateOf(meeting.StartDate),
        ends_on: dateOf(meeting.EndDate),
    };
}

/** Some universities (UPEI) post final exams as an "Examination" meeting of the section. */
const isExam = (meeting) =>
    meeting.InstructionalMethodCode === "EXAM" || /^examination$/i.test(meeting.InstructionalMethodDisplay ?? "");

/** Placeholders some timetables list as instructors: "TBA, E", "Staff", "Admin, C". */
const PLACEHOLDER = /^(TBA|TBD|Staff|Admin)\b/i;

function toSection(entry, course) {
    const section = entry.Section;
    const meetings = (section.FormattedMeetingTimes ?? []).filter((meeting) => !isExam(meeting));
    const method = meetings[0]?.InstructionalMethodDisplay ?? entry.InstructorDetails?.[0]?.InstructorMethod;
    const startsOn = dateOf(section.StartDate);
    const endsOn = dateOf(section.EndDate);
    const people = (entry.InstructorDetails ?? [])
        .map((instructor) => instructor.FacultyName ?? "")
        .filter((name) => !PLACEHOLDER.test(name))
        .map(instructorName);
    return {
        term: section.TermId,
        crn: String(section.Synonym || section.Id),
        course,
        section: String(section.Number ?? "").trim() || "-",
        ...classify(method),
        credits: section.MinimumCredits ?? null,
        capacity: section.HasUnlimitedSeats ? null : (section.Capacity ?? null),
        enrolled: section.Enrolled ?? null,
        waitlist: section.Waitlisted ?? null,
        starts_on: startsOn,
        ends_on: endsOn && startsOn && endsOn < startsOn ? startsOn : endsOn,
        link_code: null,
        cross_listed_codes: [],
        notes: null,
        meetings: meetings
            .map(toMeeting)
            .filter((meeting) => meeting.days.length || meeting.start_time || meeting.location),
        instructors: [...new Set(people.filter(Boolean))].map((name, index) => ({ name, is_primary: index === 0 })),
    };
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Course codes a requisite names: "PSYC 1110 and 1120", "COSC-1047EL", "CS 1910", "Economics 1010 and
 * 2030". A subject's name stands for its code and a bare number belongs to the last subject named.
 * Laurentian sometimes drops the language suffix ("CHMI-1006" for CHMI1006EL), so the course's own
 * suffix is tried too. `subjects` is sorted longest name first.
 */
function courseCodesIn(text, knownCodes, ownCode, subjects) {
    let upper = text.toUpperCase();
    for (const { code, name } of subjects) {
        upper = upper.replace(new RegExp(`(?<![A-Z])${escapeRegExp(name.toUpperCase())}(?![A-Z])`, "g"), code);
    }
    const subjectCodes = new Set(subjects.map((subject) => subject.code));
    const suffix = ownCode.match(/\d([A-Z]+)$/)?.[1] ?? "";
    const codes = [];
    let subject = null;
    for (const [, letters, number] of upper.matchAll(/\b(?:([A-Z]{2,5})[\s*-]?)?(\d{4}[A-Z]{0,3})\b/g)) {
        if (letters && subjectCodes.has(letters)) subject = letters;
        if (!subject) continue;
        const code = [`${subject}${number}`, `${subject}${number}${suffix}`].find((candidate) =>
            knownCodes.has(candidate),
        );
        if (code && code !== ownCode) codes.push(code);
    }
    return codes;
}

/**
 * @param {object} config
 * @param {string} config.baseUrl ".../student" (the part before /Courses)
 * @param {(code: string, description: string, startsOn: string, endsOn: string) => object} [config.describeTerm]
 *   Name and season for a term; the default reads codes like "2026/FA" and "2026/S1".
 * @returns {{scrapeTimetable: () => Promise<import("./import.js").Timetable>, scrapeCourseDetails: Function}}
 */
export function colleague({ baseUrl, describeTerm: nameTerm = describeTerm }) {
    /** Calendar entries found during the timetable scrape, by course code, for scrapeCourseDetails. */
    const calendar = new Map();
    /** The catalog's subjects, longest name first, for reading requisites. */
    let subjectsByName = [];

    async function scrapeTimetable() {
        const request = await openSession(baseUrl);
        const catalog = await request("Courses/GetCatalogAdvancedSearch");
        const subjects = (catalog.Subjects ?? [])
            .filter((subject) => subject.ShowInCourseSearch !== false)
            .map((subject) => ({ code: subject.Code.trim().toUpperCase(), name: subject.Description.trim() }));
        subjectsByName = [...subjects].sort((a, b) => b.name.length - a.name.length);
        const termNames = new Map((catalog.Terms ?? []).map((term) => [term.Item1, term.Item2]));
        log(`Terms in the catalog: ${[...termNames.keys()].join(", ")}; ${subjects.length} subjects`);

        const courses = new Map();
        const sections = new Map();
        const termDates = new Map();
        const failedSubjects = new Set();
        const exams = [];
        for (const [termIndex, term] of [...termNames.keys()].entries()) {
            for (const [subjectIndex, subject] of subjects.entries()) {
                let found;
                try {
                    found = (await searchCourses(request, term, subject.code)).filter(
                        (course) => course.MatchingSectionIds?.length,
                    );
                } catch (error) {
                    failedSubjects.add(subject.code);
                    log(`${term} ${subject.code} failed: ${error.message}`);
                    continue;
                }

                const results = await inBatches(found, async (course) => {
                    try {
                        const response = await request("Courses/Sections", {
                            courseId: course.Id,
                            sectionIds: course.MatchingSectionIds,
                        });
                        return { course, terms: response.SectionsRetrieved?.TermsAndSections ?? [] };
                    } catch (error) {
                        failedSubjects.add(subject.code);
                        log(`${term} ${course.SubjectCode}*${course.Number} sections failed: ${error.message}`);
                        return { course, terms: [] };
                    }
                });

                let count = 0;
                for (const { course, terms } of results) {
                    const code = `${course.SubjectCode}${course.Number}`.toUpperCase();
                    if (!/^[A-Z0-9]{2,20}$/.test(code)) continue;
                    courses.set(code, {
                        code,
                        subject_code: course.SubjectCode.toUpperCase(),
                        number: String(course.Number).toUpperCase(),
                        title: (course.Title ?? "").trim() || code,
                        credits: course.MinimumCredits ?? null,
                    });
                    calendar.set(code, course);
                    for (const { Term, Sections } of terms) {
                        if (Term?.StartDate) termDates.set(Term.Code, [dateOf(Term.StartDate), dateOf(Term.EndDate)]);
                        for (const entry of Sections ?? []) {
                            if (entry.Section?.TermId !== term) continue;
                            const section = toSection(entry, code);
                            sections.set(`${section.term} ${section.crn}`, section);
                            for (const meeting of (entry.Section.FormattedMeetingTimes ?? []).filter(isExam)) {
                                const day = dateOf(meeting.StartDate);
                                const start = timeOf(meeting.StartTime);
                                if (!day || !start) continue;
                                const end = timeOf(meeting.EndTime);
                                exams.push({
                                    term,
                                    course: code,
                                    section: section.section,
                                    starts_at: `${day}T${start}`,
                                    ends_at: end && end > start ? `${day}T${end}` : null,
                                    location: toMeeting(meeting).location,
                                });
                            }
                            count++;
                        }
                    }
                }
                log(
                    `[${termIndex + 1}/${termNames.size} ${term}] [${subjectIndex + 1}/${subjects.length}] ${subject.code}: ${count} sections`,
                );
            }
        }

        const allSections = [...sections.values()];
        const terms = [...termNames]
            .filter(([code]) => termDates.has(code) && allSections.some((section) => section.term === code))
            .map(([code, description]) => nameTerm(code, description, ...termDates.get(code)));

        return {
            terms,
            subjects,
            courses: [...courses.values()],
            sections: allSections,
            exams: exams.filter((exam) => terms.some((term) => term.code === exam.term)),
            failedSubjects: [...failedSubjects],
        };
    }

    /**
     * Descriptions and requisites come with the search results, so this uses what scrapeTimetable kept.
     * Courses not seen in this run are skipped.
     * @returns {AsyncGenerator<import("./import.js").CourseDetails[]>}
     */
    async function* scrapeCourseDetails(courses, knownCodes, batchSize = 200) {
        let batch = [];
        for (const { code } of courses) {
            const course = calendar.get(code);
            if (!course) continue;
            const kindOf = new Map(
                (course.Requisites ?? []).map((requisite) => [
                    requisite.RequirementCode,
                    completionKinds[requisite.CompletionOrder] ?? "prerequisite",
                ]),
            );
            const lines = [];
            const requisites = [];
            for (const requisite of course.CourseRequisites ?? []) {
                const text = [requisite.DisplayText, requisite.DisplayTextExtension].filter(Boolean).join(" ").trim();
                if (!text) continue;
                const kind = kindOf.get(requisite.RequisiteId) ?? "prerequisite";
                lines.push(`${kind === "corequisite" ? "Corequisites" : "Prerequisites"}: ${text}`);
                for (const required of courseCodesIn(requisite.DisplayText ?? "", knownCodes, code, subjectsByName)) {
                    requisites.push({ code: required, kind });
                }
            }
            batch.push({
                code,
                description: (course.Description ?? "").replace(/\s+/g, " ").trim() || null,
                requisites_text: lines.join("\n") || null,
                requisites: [
                    ...new Map(
                        requisites.map((requisite) => [`${requisite.kind} ${requisite.code}`, requisite]),
                    ).values(),
                ],
            });
            if (batch.length >= batchSize) {
                yield batch;
                batch = [];
            }
        }
        if (batch.length) yield batch;
    }

    return { scrapeTimetable, scrapeCourseDetails };
}

const completionKinds = { Previous: "prerequisite", Concurrent: "corequisite", PreviousOrConcurrent: "corequisite" };
