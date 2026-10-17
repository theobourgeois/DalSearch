/**
 * Prints a university's recent refreshes and what went wrong in them.
 *
 *     node runs.js dal      # the last 5
 *     node runs.js dal 20
 */
import { connect } from "./lib/import.js";
import { formatRun, recentRuns } from "./lib/runs.js";

const [university, count = "5"] = process.argv.slice(2);
if (!university) {
    console.error("Usage: node runs.js <university> [count]");
    process.exit(1);
}
const runs = await recentRuns(connect({ readOnly: true }), university, Number(count));
console.log(runs.length ? runs.map(formatRun).join("\n\n") : `No recorded runs for ${university}`);
