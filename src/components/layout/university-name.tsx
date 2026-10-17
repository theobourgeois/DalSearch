"use client";

import { useUniversity } from "@/components/university";

/** The full name of the university whose pages are showing, for server components' copy. */
export function UniversityName() {
    return <>{useUniversity().name}</>;
}
