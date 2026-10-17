"use client";

import { useEffect, useState } from "react";
import { useUniversity } from "@/components/university";
import { campusNow, type CampusNow } from "@/lib/time";

/** The current campus day and time, refreshed every minute. Null until mounted so server markup stays stable. */
export function useCampusNow(): CampusNow | null {
    const { timezone } = useUniversity();
    const [now, setNow] = useState<CampusNow | null>(null);

    useEffect(() => {
        const tick = () => setNow(campusNow(timezone));
        tick();
        const interval = setInterval(tick, 60_000);
        return () => clearInterval(interval);
    }, [timezone]);

    return now;
}
