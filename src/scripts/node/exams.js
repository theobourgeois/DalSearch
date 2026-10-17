/**
 * Saves a term's final exam schedule, replacing what's stored for that term.
 *
 *     node exams.js dal 202720 exams.tsv
 *
 * The file is whatever the university's parseExams() in universities/<id>.js reads; for Dal, the
 * tables copied from its exam schedule page.
 */
import fs from "fs";
import { connect, log } from "./lib/import.js";

/** "2025-04-12T15:30" in `timeZone` as a UTC ISO timestamp. */
function zonedToUtc(local, timeZone) {
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

async function main() {
    const [university, term, file] = process.argv.slice(2);
    if (!university || !term || !file) throw new Error("Usage: node exams.js <university> <term> <file>");

    const scraper = await import(`./universities/${university}.js`);
    if (!scraper.parseExams) throw new Error(`No exam schedule parser for ${university}`);
    const db = connect();
    const [{ timezone }] = await db.selectAll("universities", "timezone", { id: `eq.${university}` });

    const exams = scraper.parseExams(fs.readFileSync(file, "utf8")).map((exam) => ({
        ...exam,
        starts_at: zonedToUtc(exam.starts_at, timezone),
    }));
    if (exams.length === 0) throw new Error(`No exams found in ${file}`);

    const saved = await db.rpc("import_exams", { p_university: university, p_term: term, p_exams: exams });
    log(`Saved ${saved} of ${exams.length} exams for ${term}; the rest are for courses that aren't stored`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
