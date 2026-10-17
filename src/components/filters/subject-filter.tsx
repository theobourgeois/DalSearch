"use client";

import { useMemo } from "react";
import type { Subject } from "@/lib/types";
import { MultiSelectFilter } from "./filter-pill";

type SubjectFilterProps = {
    subjects: Subject[];
    selected: string[];
    onChange: (codes: string[]) => void;
};

/** A searchable subject checklist: "Subject Computer Science ▾". */
export function SubjectFilter({ subjects, selected, onChange }: SubjectFilterProps) {
    const options = useMemo(
        () => subjects.map((subject) => ({ value: subject.code, label: `${subject.name} (${subject.code})` })),
        [subjects],
    );
    const names = useMemo(() => new Map(subjects.map((subject) => [subject.code, subject.name])), [subjects]);

    return (
        <MultiSelectFilter
            label="Subject"
            options={options}
            selected={selected}
            onChange={onChange}
            summary={(chosen) =>
                chosen.length === 1 ? (names.get(chosen[0].value) ?? chosen[0].value) : `${chosen.length} subjects`
            }
            searchPlaceholder="Find a subject"
        />
    );
}
