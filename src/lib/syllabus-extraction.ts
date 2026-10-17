import "server-only";

import extraction from "./syllabus-extraction.json";
import type { GradingScheme, Syllabus, Textbook } from "./syllabi";

/** The model syllabi.py uses, so uploaded and scraped syllabi read the same way. */
export const SYLLABUS_MODEL = "gpt-6-luna";

/** What the model reads from a syllabus (the schema in syllabus-extraction.json). */
export type SyllabusDetails = {
    is_syllabus: boolean;
    course_codes: string[];
    term_season: Syllabus["term_season"];
    term_year: number | null;
    instructors: string[];
    grading_schemes: GradingScheme[];
    textbooks: Textbook[];
    policies: { topic: string; summary: string }[];
    weekly_topics: { when: string; topic: string }[];
    class_meetings: string | null;
};

/** Reads a syllabus PDF. The file goes to the model as is, so scanned pages are read too. */
export async function extractSyllabus(pdf: ArrayBuffer, fileName: string, universityName: string, course: string) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("Set OPENAI_API_KEY");
    const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model: SYLLABUS_MODEL,
            instructions: extraction.instructions.replace("{university}", universityName),
            input: [
                {
                    role: "user",
                    content: [
                        {
                            type: "input_file",
                            filename: fileName,
                            file_data: `data:application/pdf;base64,${Buffer.from(pdf).toString("base64")}`,
                        },
                        { type: "input_text", text: `A student shared this as the syllabus for ${course}.` },
                    ],
                },
            ],
            reasoning: { effort: "low" },
            text: { format: { type: "json_schema", name: "syllabus", strict: true, schema: extraction.schema } },
        }),
    });
    if (!response.ok) throw new Error(`The model couldn't read the file: HTTP ${response.status}`);
    const result = await response.json();
    const output = result.output
        ?.filter((item: { type: string }) => item.type === "message")
        .flatMap((item: { content: { text?: string }[] }) => item.content)
        .find((part: { text?: string }) => part.text)?.text;
    if (!output) throw new Error("The model didn't answer");
    return JSON.parse(output) as SyllabusDetails;
}

/** "CSCI 2110" -> "CSCI2110". */
export const normalizeCode = (code: string) => code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

/** Every grading scheme's weights total 95-105% (bonus marks and rounding aside), as in syllabi.py. */
export function weightsAddUp(details: SyllabusDetails): boolean {
    const schemes = details.grading_schemes ?? [];
    return (
        schemes.length > 0 &&
        schemes.every((scheme) => {
            const total = scheme.components.reduce((sum, component) => sum + (component.weight ?? 0), 0);
            return total >= 95 && total <= 105;
        })
    );
}
