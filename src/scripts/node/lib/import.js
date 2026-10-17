/**
 * Writes scraped data to Supabase through the import_* functions in
 * supabase/migrations/20261017120000_catalog.sql, with the secret key. Every university's scraper
 * produces the shapes below, so the database and the app don't need to know where data came from.
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY, from the environment or the repo's .env.local.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * @typedef {Object} Term
 * @property {string} code The university's own code, e.g. "202710".
 * @property {string} name "Fall 2026".
 * @property {"fall"|"winter"|"spring"|"summer"|"full_year"|"other"} season
 * @property {number} year The calendar year the term starts in.
 * @property {string} starts_on "2026-09-08".
 * @property {string} ends_on
 *
 * @typedef {Object} Subject
 * @property {string} code Uppercase letters and digits, e.g. "CSCI".
 * @property {string} name "Computer Science".
 *
 * @typedef {Object} Course
 * @property {string} code subject_code + number, e.g. "CSCI2122".
 * @property {string} subject_code
 * @property {string} number
 * @property {string} title
 * @property {number|null} credits
 *
 * @typedef {Object} Meeting
 * @property {("M"|"T"|"W"|"R"|"F"|"S"|"U")[]} days
 * @property {string|null} start_time "08:35"; null with end_time when there's no set time.
 * @property {string|null} end_time Later than start_time.
 * @property {string|null} location Readable text for where it meets: "Goldberg Computer Science Bldg 127", "Online (asynchronous)".
 * @property {{campus: string|null, building: string, room: string|null}[]} rooms The physical rooms it's in; empty online or unscheduled.
 * @property {string|null} starts_on
 * @property {string|null} ends_on
 *
 * @typedef {Object} Section
 * @property {string} term Term code.
 * @property {string} crn The university's id for the section, unique within the term.
 * @property {string} course Course code.
 * @property {string} section "01", "B01".
 * @property {string} type The university's label, e.g. "Lec".
 * @property {string} kind One of the section_kind values: "lecture", "lab", "tutorial", ... "other".
 * @property {number|null} credits
 * @property {number|null} capacity
 * @property {number|null} enrolled
 * @property {number|null} waitlist
 * @property {string|null} starts_on
 * @property {string|null} ends_on
 * @property {string|null} link_code
 * @property {string[]} cross_listed_codes
 * @property {string|null} notes
 * @property {Meeting[]} meetings
 * @property {{name: string, is_primary: boolean}[]} instructors
 *
 * @typedef {Object} Timetable What a university's scraper returns.
 * @property {Term[]} terms The terms on the timetable that have sections.
 * @property {Subject[]} subjects
 * @property {Course[]} courses
 * @property {Section[]} sections
 * @property {string[]} failedSubjects Subjects that couldn't be downloaded; their stored sections are kept.
 * @property {Exam[]} [exams] Final exams, when the timetable lists them; each term's replace what's stored.
 *
 * @typedef {Object} Exam
 * @property {string} term
 * @property {string} course
 * @property {string} section As the timetable writes it.
 * @property {string} starts_at Local time on campus: "2026-12-18T10:00".
 * @property {string|null} [ends_at]
 * @property {string|null} [location]
 *
 * @typedef {Object} CourseDetails What a university's calendar says about a course.
 * @property {string} code
 * @property {string|null} description Plain text.
 * @property {string|null} requisites_text
 * @property {{code: string, kind: "prerequisite"|"corequisite"|"exclusion"}[]} requisites
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const PAGE_SIZE = 1000;

function loadEnv() {
    const env = {};
    const file = path.join(ROOT, ".env.local");
    if (fs.existsSync(file)) {
        for (const line of fs.readFileSync(file, "utf8").split("\n")) {
            const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/);
            if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
        }
    }
    return { ...env, ...process.env };
}

export function connect() {
    const env = loadEnv();
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SECRET_KEY;
    if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY");

    const base = `${url.replace(/\/$/, "")}/rest/v1`;
    const headers = { apikey: key, "Content-Type": "application/json" };
    // Legacy service_role keys are JWTs and go in the Authorization header too.
    if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;

    async function request(pathname, init = {}) {
        const response = await fetch(`${base}/${pathname}`, { ...init, headers: { ...headers, ...init.headers } });
        if (!response.ok) {
            throw new Error(`${init.method ?? "GET"} ${pathname}: HTTP ${response.status} ${await response.text()}`);
        }
        return response;
    }

    return {
        /** Calls one of the import_* functions. */
        async rpc(name, args) {
            const response = await request(`rpc/${name}`, { method: "POST", body: JSON.stringify(args) });
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        },

        /**
         * Every row of a table or view matching `filters` (PostgREST syntax), a page at a time. Pages
         * advance by what came back, in case the project returns fewer rows per request than asked.
         */
        async selectAll(table, columns, filters = {}, order = "id") {
            const rows = [];
            for (;;) {
                const params = new URLSearchParams({ select: columns, order, ...filters });
                const response = await request(`${table}?${params}`, {
                    headers: { Range: `${rows.length}-${rows.length + PAGE_SIZE - 1}` },
                });
                const page = await response.json();
                if (page.length === 0) return rows;
                rows.push(...page);
            }
        },

        async count(table, filters = {}) {
            const params = new URLSearchParams({ select: "*", ...filters });
            const response = await request(`${table}?${params}`, {
                method: "HEAD",
                headers: { Prefer: "count=exact", Range: "0-0" },
            });
            return Number(response.headers.get("content-range")?.split("/")[1] ?? 0);
        },
    };
}

/** Splits a list into lists of at most `size`. */
export function chunk(items, size) {
    const chunks = [];
    for (let start = 0; start < items.length; start += size) chunks.push(items.slice(start, start + size));
    return chunks;
}

export function log(...args) {
    console.log(`[${new Date().toISOString()}]`, ...args);
}

/** "2025-04-12T15:30" in `timeZone` as a UTC ISO timestamp. */
export function zonedToUtc(local, timeZone) {
    const [date, time] = local.split("T");
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);
    const asUtc = Date.UTC(year, month - 1, day, hours, minutes);
    // The zone's offset at that moment, found by formatting it there and comparing.
    const offsetAt = (instant) => {
        const parts = Object.fromEntries(
            new Intl.DateTimeFormat("en-US", {
                timeZone,
                hourCycle: "h23",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            })
                .formatToParts(new Date(instant))
                .map(({ type, value }) => [type, value]),
        );
        return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - instant;
    };
    const guess = asUtc - offsetAt(asUtc);
    return new Date(asUtc - offsetAt(guess)).toISOString();
}
