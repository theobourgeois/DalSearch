"use client";

import { useTerms } from "@/components/current-term";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { Term } from "@/lib/constants";
import { useCourse } from "./course-context";

/** Switches the course page between the terms it's offered in. */
export function CourseTermSwitch() {
    const { term, setTerm, offered } = useCourse();
    const { options } = useTerms();
    if (offered.length === 0) return null;

    return (
        <SegmentedControl<Term>
            aria-label="Term"
            value={term}
            onValueChange={setTerm}
            options={options((term) => !offered.includes(term))}
        />
    );
}
