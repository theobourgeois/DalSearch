import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

const courses = require("../database/search.json");

const OUTPUT = path.join(__dirname, "../database/course-embeddings.json");
const CONCURRENCY = 10;        // requests per batch
const BATCH_DELAY_MS = 8000;   // 8s between batches → 75 RPM (safe under 100 RPM)

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function buildCourseText(course: any): string {
    const allInstructors = Object.values(course.instructorsByTerm).flat() as string[];
    const uniqueInstructors = [...new Set(allInstructors)].filter((n) => n !== "Staff");
    const termList = [...new Set(course.termClasses.map((tc: any) => tc.term))];

    return [
        `${course.subjectCode}${course.courseCode} - ${course.title}`,
        `Subject: ${course.subjectCode}`,
        `Level: ${course.courseCode[0]}000`,
        `Credits: ${course.creditHours}`,
        course.description ? `Description: ${stripHtml(course.description).slice(0, 400)}` : "",
        course.prerequisites?.length ? `Prerequisites: ${course.prerequisites.join(", ")}` : "",
        uniqueInstructors.length ? `Instructors: ${uniqueInstructors.join(", ")}` : "",
        termList.length ? `Available terms: ${termList.join(", ")}` : "",
    ].filter(Boolean).join("\n");
}

async function embedWithRetry(model: any, text: string, retries = 5): Promise<number[]> {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (err: any) {
            if (err?.status === 429 && attempt < retries - 1) {
                const delay = 2000 * (attempt + 1);
                await new Promise((r) => setTimeout(r, delay));
            } else {
                throw err;
            }
        }
    }
    throw new Error("Max retries exceeded");
}

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { console.error("GEMINI_API_KEY not set"); process.exit(1); }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

    const courseList = Object.values(courses) as any[];
    const entries = courseList.map((c) => ({
        code: `${c.subjectCode}${c.courseCode}`,
        text: buildCourseText(c),
    }));

    // Load existing progress
    const embeddings: Record<string, number[]> = fs.existsSync(OUTPUT)
        ? JSON.parse(fs.readFileSync(OUTPUT, "utf-8"))
        : {};

    const remaining = entries.filter((e) => !embeddings[e.code]);
    console.log(`Total: ${entries.length} | Already done: ${entries.length - remaining.length} | Remaining: ${remaining.length}`);

    let done = 0;
    const start = Date.now();

    for (let i = 0; i < remaining.length; i += CONCURRENCY) {
        const batch = remaining.slice(i, i + CONCURRENCY);

        const results = await Promise.all(
            batch.map((e) => embedWithRetry(model, e.text).then((vec) => ({ code: e.code, vec })))
        );

        results.forEach(({ code, vec }) => { embeddings[code] = vec; });
        done += batch.length;

        const elapsed = (Date.now() - start) / 1000;
        const rate = done / elapsed;
        const eta = Math.round((remaining.length - done) / rate);
        process.stdout.write(`\r${done}/${remaining.length} (${Math.round(rate)}/s, ETA ~${eta}s)   `);

        // Save progress every 100 courses
        if (done % 100 === 0 || done === remaining.length) {
            fs.writeFileSync(OUTPUT, JSON.stringify(embeddings));
        }

        if (i + CONCURRENCY < remaining.length) {
            await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
        }
    }

    fs.writeFileSync(OUTPUT, JSON.stringify(embeddings));
    console.log(`\nDone. Saved ${Object.keys(embeddings).length} embeddings to ${OUTPUT}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
