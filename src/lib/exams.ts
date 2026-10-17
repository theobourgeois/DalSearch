import type { ClassSession, ExamData, Term } from "./types";
import { UNIVERSITY_TIMEZONE } from "./university";

/** Final exams by term, then course code. */
export type ExamSchedule = Record<Term, Record<string, ExamData[]>>;

/** The final exam for a scheduled course. Exams are listed per lecture section ("1" for Lec 01). */
export function findExam(exams: ExamData[] | undefined, sessions: ClassSession[]): ExamData | undefined {
    const lecture = sessions.find((session) => session.type === "Lec");
    if (!lecture || !exams) return undefined;
    const section = String(Number(lecture.section));
    return exams.find((exam) => exam.section === section);
}

/** "Apr 9, 15:30" on campus, wherever the code runs. */
export function formatExam(exam: ExamData): string {
    const date = new Date(exam.startsAt);
    if (Number.isNaN(date.getTime())) return "";
    const zone = { timeZone: UNIVERSITY_TIMEZONE } as const;
    const day = date.toLocaleDateString("en-CA", { ...zone, month: "short", day: "numeric" });
    const time = date.toLocaleTimeString("en-CA", { ...zone, hour: "numeric", minute: "2-digit", hourCycle: "h23" });
    return `${day}, ${time.replace(/^0/, "")}`;
}
