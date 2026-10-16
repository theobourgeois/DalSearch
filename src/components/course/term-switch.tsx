"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { termOptions, type Term } from "@/lib/constants";
import { useCourse } from "./course-context";

/** Switches the course page between the terms it's offered in. */
export function CourseTermSwitch() {
    const { term, setTerm, offered } = useCourse();
    if (offered.length === 0) return null;

    return (
        <SegmentedControl<Term>
            aria-label="Term"
            value={term}
            onValueChange={setTerm}
            options={termOptions((term) => !offered.includes(term))}
        />
    );
}
