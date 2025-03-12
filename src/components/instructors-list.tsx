"use client";

import type { InstructorData } from "@/lib/types";
import { InstructorCard } from "./instructor-card";

interface InstructorsListProps {
    instructors: InstructorData[];
}

export function InstructorsList({ instructors }: InstructorsListProps) {
    if (instructors.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-muted-foreground">
                    No instructors found matching your criteria.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 p-4 md:grid-cols-1 lg:grid-cols-2">
            {instructors.map((instructor, index) => (
                <InstructorCard key={index} instructor={instructor} />
            ))}
        </div>
    );
}
