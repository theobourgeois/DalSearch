import "server-only";

import { getCourse, getCourseCounts, getCurrentTerm, getTerms } from "./data";
import { findClashes } from "./schedule";
import { termLabel } from "./terms";
import type { ClassSession, CourseAndSubjectCode } from "./types";

const UNIVERSITY = "dal";

/** First-year courses Dal runs most terms; the sample week takes the ones on this term's timetable. */
const SAMPLE_COURSES = [
    "MATH1000",
    "MATH1010",
    "CHEM1011",
    "CHEM1012",
    "BIOL1010",
    "BIOL1011",
    "ECON1101",
    "ECON1102",
    "PSYO1021",
    "PSYO1022",
    "CSCI1105",
    "CSCI1110",
];
const SAMPLE_SIZE = 5;

/** One section of a course: its meetings (usually one weekly time) and who teaches it. */
export type SampleClass = {
    code: CourseAndSubjectCode;
    sessions: ClassSession[];
    title: string;
    instructor: string | null;
};

export type SampleWeek = {
    university: string;
    termName: string;
    classes: SampleClass[];
};

/** A real week: one lecture section each of a few first-year courses at Dal, none clashing. */
async function sampleWeek(): Promise<SampleWeek> {
    const [term, terms] = await Promise.all([getCurrentTerm(UNIVERSITY), getTerms(UNIVERSITY)]);
    const week: SampleClass[] = [];
    for (const code of SAMPLE_COURSES) {
        if (week.length >= SAMPLE_SIZE) break;
        const course = await getCourse(UNIVERSITY, code);
        const lectures = course?.termClasses.filter((session) => session.term === term && session.type === "Lec") ?? [];
        const sections = [...new Set(lectures.map((session) => session.crn))].map((crn) =>
            lectures.filter((session) => session.crn === crn),
        );
        const taken = week.flatMap((sample) => sample.sessions);
        const fitting = sections.find((section) =>
            section.every((session) => findClashes(session, taken).length === 0),
        );
        if (course && fitting) {
            week.push({
                code: fitting[0].course,
                sessions: fitting,
                title: course.title,
                instructor: fitting[0].instructors?.[0] ?? null,
            });
        }
    }
    return { university: UNIVERSITY, termName: termLabel(terms, term), classes: week };
}

async function courseCounts(): Promise<Record<string, number>> {
    try {
        return await getCourseCounts();
    } catch (error) {
        console.error("Couldn't count courses for the landing page", error);
        return {};
    }
}

/** Everything the landing page shows that comes from the database. */
export async function getLandingData() {
    const [counts, week] = await Promise.all([
        courseCounts(),
        sampleWeek().catch((error) => {
            console.error("Couldn't build the landing page's sample week", error);
            return null;
        }),
    ]);
    return { counts, week };
}

export type LandingData = Awaited<ReturnType<typeof getLandingData>>;
