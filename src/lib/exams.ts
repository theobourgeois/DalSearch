import type { ClassSession, ExamData } from "./types";

/** Final exams by course code, with the term code the exam dates fall in. */
export type ExamSchedule = { term: string; exams: Record<string, ExamData[]> };

/** The final exam for a scheduled course. Exams are listed per lecture section ("1" for Lec 01). */
export function findExam(exams: ExamData[] | undefined, sessions: ClassSession[]): ExamData | undefined {
    const lecture = sessions.find((session) => session.type === "Lec");
    if (!lecture || !exams) return undefined;
    const section = String(Number(lecture.section));
    return exams.find((exam) => exam.section === section);
}

/** { date: "2025-04-09", time: "3:30:00 PM" } -> "Apr 9, 15:30"; falls back to the raw text if it doesn't parse. */
export function formatExam(exam: ExamData): string {
    const date = new Date(`${exam.date}T00:00:00`);
    const time = exam.time.match(/^(\d{1,2}):(\d{2})(?::\d{1,2})?\s*(AM|PM)$/i);
    if (Number.isNaN(date.getTime()) || !time) return [exam.date, exam.time].filter(Boolean).join(" ");

    const [, hours, minutes, period] = time;
    const hours24 = (Number(hours) % 12) + (period.toUpperCase() === "PM" ? 12 : 0);
    return `${date.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}, ${hours24}:${minutes}`;
}
