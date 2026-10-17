import type { ClassSession, ExamData, Term } from "./types";

/** Final exams by term, then course code. */
export type ExamSchedule = Record<Term, Record<string, ExamData[]>>;

/**
 * The final exam for a scheduled course. Exams are listed per lecture section, written as the section
 * ("1A") or, at Dal, its number ("1" for Lec 01).
 */
export function findExam(exams: ExamData[] | undefined, sessions: ClassSession[]): ExamData | undefined {
    const lecture = sessions.find((session) => session.type === "Lec") ?? sessions[0];
    if (!lecture || !exams) return undefined;
    return exams.find((exam) => exam.section === lecture.section || exam.section === String(Number(lecture.section)));
}

/** "Apr 9, 15:30" on campus (`timeZone`), wherever the code runs. */
export function formatExam(exam: ExamData, timeZone: string): string {
    const date = new Date(exam.startsAt);
    if (Number.isNaN(date.getTime())) return "";
    const zone = { timeZone } as const;
    const day = date.toLocaleDateString("en-CA", { ...zone, month: "short", day: "numeric" });
    const time = date.toLocaleTimeString("en-CA", { ...zone, hour: "numeric", minute: "2-digit", hourCycle: "h23" });
    return `${day}, ${time.replace(/^0/, "")}`;
}
