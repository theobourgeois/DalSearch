"use client";

import { PlusIcon, ShareNetworkIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageActions } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { termLabel } from "@/lib/constants";
import { listSessions } from "@/lib/schedule";
import { useCourse } from "./course-context";
import { SaveButton } from "./save-button";

async function share(title: string) {
    const url = window.location.href;
    if (navigator.share) {
        await navigator.share({ title, url }).catch(() => undefined);
        return;
    }
    await navigator.clipboard.writeText(url);
    toast("Link copied");
}

/** "Add to schedule", plus save and share. */
export function CourseActions({ title }: { title: string }) {
    const { code, term, offered, selected, inSchedule, changed, saveToSchedule, removeFromSchedule, schedule } =
        useCourse();
    const ready = schedule.ready;

    let action: React.ReactNode;
    let hint: React.ReactNode;
    if (offered.length === 0) {
        action = (
            <Button size="lg" variant="primary" disabled>
                Not offered
            </Button>
        );
        hint = "This course isn't on the timetable for any upcoming term.";
    } else if (inSchedule && !changed) {
        action = (
            <Button size="lg" variant="outline" onClick={removeFromSchedule}>
                Remove from schedule
            </Button>
        );
        hint = `In your ${termLabel(term)} schedule`;
    } else {
        action = (
            <Button size="lg" variant="primary" onClick={saveToSchedule} disabled={!ready || selected.length === 0}>
                <PlusIcon weight="bold" />
                {inSchedule ? "Update schedule" : "Add to schedule"}
            </Button>
        );
        hint = selected.length > 0 ? `${listSessions(selected)} selected` : "Pick a section below";
    }

    return (
        <PageActions
            trailing={
                <>
                    <SaveButton code={code} />
                    <SimpleTooltip label="Share">
                        <Button variant="ghost" size="icon" aria-label="Share" onClick={() => share(title)}>
                            <ShareNetworkIcon />
                        </Button>
                    </SimpleTooltip>
                </>
            }
        >
            {action}
            <span className="text-sm font-medium text-fg-muted">{hint}</span>
        </PageActions>
    );
}
