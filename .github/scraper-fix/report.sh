#!/usr/bin/env bash
# Run by scraper-fix.yml after the agent. Opens a pull request when the agent changed the scraper
# and the dry run passed; otherwise posts the agent's report on the issue. Reads what the
# investigate job left in $RUNNER_TEMP/fix: report.md, fix.patch and dry-run.log.
set -euo pipefail

dir="$RUNNER_TEMP/fix"
mkdir -p "$dir"
report="$dir/report.md"
[ -s "$report" ] || echo "The agent didn't finish a report. The workflow run has its log." > "$report"

body="$dir/body.md"
{
    cat "$report"
    if [ -s "$dir/dry-run.log" ]; then
        printf '\n<details><summary>Dry run</summary>\n\n```\n'
        tail -n 80 "$dir/dry-run.log"
        printf '```\n</details>\n'
    fi
    printf '\n[Workflow run](%s)\n' "$RUN_URL"
} > "$body"

if [ "$CHANGED" = true ] && [ "$VERIFIED" = true ]; then
    branch="scraper-fix/$UNIVERSITY-$GITHUB_RUN_ID"
    git config user.name "github-actions[bot]"
    git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
    git switch -c "$branch"
    git apply "$dir/fix.patch"
    git add -A
    git commit -m "Fix the $UNIVERSITY scraper" -m "Found and fixed by the Scraper Fix workflow${ISSUE:+ for #$ISSUE}; passes a dry run."
    git push origin "$branch"
    url=$(gh pr create --base "$GITHUB_REF_NAME" --head "$branch" --title "Fix the $UNIVERSITY scraper" --body-file "$body")
    echo "Opened $url" >> "$GITHUB_STEP_SUMMARY"
    if [ -n "$ISSUE" ]; then gh issue comment "$ISSUE" --body "Opened $url with a fix that passes a dry run."; fi
else
    comment="$dir/comment.md"
    {
        if [ "$CHANGED" = true ]; then
            echo "The agent changed the scraper but the fix didn't pass the checks, so no pull request was opened."
            echo
            if [ -n "${REJECTED:-}" ]; then echo "It edited files it shouldn't: $REJECTED"; echo; fi
        fi
        cat "$body"
        if [ "$CHANGED" = true ] && [ -s "$dir/fix.patch" ]; then
            printf '\n<details><summary>Its changes</summary>\n\n```diff\n'
            head -c 50000 "$dir/fix.patch"
            printf '\n```\n</details>\n'
        fi
    } > "$comment"
    cat "$comment" >> "$GITHUB_STEP_SUMMARY"
    if [ -n "$ISSUE" ]; then gh issue comment "$ISSUE" --body-file "$comment"; fi
fi
