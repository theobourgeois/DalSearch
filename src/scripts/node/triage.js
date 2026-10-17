/**
 * Runs after the daily refresh. A university whose last two refreshes failed (or saved with
 * warnings, or never finished) gets an issue labelled scraper-broken and the Scraper Fix workflow,
 * which sends an agent to find out why and open a pull request. Two in a row, because university
 * servers go down overnight and come back. One issue per university: it stays open, without new
 * agents, until a refresh is healthy again, which closes it.
 *
 *     node triage.js            # in GitHub Actions, with GITHUB_TOKEN and GITHUB_REPOSITORY
 *     node triage.js --dry-run  # only print what it would do
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connect, log } from "./lib/import.js";
import { formatRun, recentRuns } from "./lib/runs.js";

const LABEL = "scraper-broken";
const FIX_WORKFLOW = "scraper-fix.yml";
// A latest run older than this means the university wasn't refreshed today; nothing to judge.
const STALE_HOURS = 36;

const dryRun = process.argv.includes("--dry-run");
const env = process.env;
const runUrl = env.GITHUB_RUN_ID
    ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
    : null;

async function github(method, pathname, body) {
    const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}${pathname}`, {
        method,
        headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        body: body && JSON.stringify(body),
    });
    if (response.status === 404 && method === "GET") return null;
    if (!response.ok) throw new Error(`GitHub ${method} ${pathname}: HTTP ${response.status} ${await response.text()}`);
    return response.status === 204 ? null : response.json();
}

/** "healthy", "broken" or "unknown" (not refreshed lately, or one bad run that may be a blip). */
function judge(runs) {
    const [latest, previous] = runs;
    if (!latest || Date.now() - new Date(latest.started_at) > STALE_HOURS * 3600 * 1000) return "unknown";
    if (latest.status === "ok") return "healthy";
    // The refresh workflow doesn't overlap itself, so a run still "running" now was stopped or crashed.
    return previous && previous.status !== "ok" ? "broken" : "unknown";
}

function issueBody(name, runs) {
    return [
        `The **${name}** scraper has had problems in its last two refreshes. ` +
            "When a refresh fails nothing is saved, so the site keeps showing the last good data, which gets older each day.",
        "",
        runs.map(formatRun).join("\n\n"),
        "",
        ...(runUrl ? [`[Refresh log](${runUrl})`, ""] : []),
        "An agent is looking into it. It will open a pull request with a fix, or explain here why it can't. " +
            "This issue closes by itself after the next healthy refresh.",
    ].join("\n");
}

async function main() {
    const db = connect({ readOnly: dryRun });
    const scrapers = path.join(path.dirname(fileURLToPath(import.meta.url)), "universities");
    const ids = fs.readdirSync(scrapers).filter((file) => file.endsWith(".js")).map((file) => file.slice(0, -3)).sort();
    const names = new Map((await db.selectAll("universities", "id,name")).map((row) => [row.id, row.name]));

    const openIssues = dryRun
        ? []
        : ((await github("GET", `/issues?labels=${LABEL}&state=open&per_page=100`)) ?? []).filter((issue) => !issue.pull_request);
    const issueFor = (id) => openIssues.find((issue) => issue.title.startsWith(`[${id}] `));
    let labelReady = false;
    let errors = 0;

    for (const id of ids) {
        try {
            const runs = await recentRuns(db, id, 2);
            const verdict = judge(runs);
            const issue = issueFor(id);
            const name = names.get(id) ?? id;

            if (verdict === "broken" && !issue) {
                log(`${id}: broken, opening an issue and sending an agent`);
                if (dryRun) {
                    console.log(issueBody(name, runs));
                    continue;
                }
                if (!labelReady && !(await github("GET", `/labels/${LABEL}`))) {
                    await github("POST", "/labels", {
                        name: LABEL,
                        color: "d73a4a",
                        description: "A university's daily refresh keeps failing",
                    });
                }
                labelReady = true;
                const created = await github("POST", "/issues", {
                    title: `[${id}] The ${name} scraper needs attention`,
                    body: issueBody(name, runs),
                    labels: [LABEL],
                });
                await github("POST", `/actions/workflows/${FIX_WORKFLOW}/dispatches`, {
                    ref: env.GITHUB_REF_NAME || "main",
                    inputs: { university: id, issue: String(created.number) },
                });
                log(`${id}: opened #${created.number}`);
            } else if (verdict === "healthy" && issue) {
                log(`${id}: healthy again, closing #${issue.number}`);
                if (dryRun) continue;
                const when = runs[0].started_at.slice(0, 10);
                await github("POST", `/issues/${issue.number}/comments`, {
                    body: `The ${when} refresh was healthy, closing.`,
                });
                await github("PATCH", `/issues/${issue.number}`, { state: "closed", state_reason: "completed" });
            } else {
                log(`${id}: ${verdict}${issue ? `, #${issue.number} open` : ""}`);
            }
        } catch (error) {
            errors++;
            log(`${id}: ${error.message}`);
        }
    }
    if (errors) process.exit(1);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
