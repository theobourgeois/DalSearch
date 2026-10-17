/** Reading refresh_runs, for runs.js, triage.js and the issues and prompts they write. */

export async function recentRuns(db, university, limit) {
    return db.select(
        "refresh_runs",
        "id,started_at,finished_at,status,problems,error,metrics",
        { university_id: `eq.${university}` },
        { order: "started_at.desc", limit },
    );
}

/** A run as Markdown: when, how it went, what was wrong. */
export function formatRun(run) {
    const started = run.started_at.slice(0, 16).replace("T", " ");
    const minutes = run.finished_at ? Math.round((new Date(run.finished_at) - new Date(run.started_at)) / 60000) : null;
    // A run that never finished was stopped or crashed before it could say.
    const status = run.status === "running" ? "unfinished" : run.status;
    const lines = [`**${started} UTC: ${status}**${minutes === null ? "" : ` (${minutes} min)`}`];
    if (run.metrics) {
        const terms = Object.values(run.metrics.terms)
            .map((term) => `${term.name} ${term.sections}`)
            .join(", ");
        lines.push(`${run.metrics.sections} sections scraped${terms ? ` (${terms})` : ""}`);
    }
    for (const problem of run.problems) lines.push(`- ${problem}`);
    if (run.error && !run.problems.length) lines.push("```", run.error.trim(), "```");
    return lines.join("\n");
}
