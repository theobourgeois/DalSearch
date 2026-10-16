"use client";

import { useEffect, useState } from "react";
import { campusNow, type CampusNow } from "@/lib/time";

/** The current campus day and time, refreshed every minute. Null until mounted so server markup stays stable. */
export function useCampusNow(): CampusNow | null {
    const [now, setNow] = useState<CampusNow | null>(null);

    useEffect(() => {
        const tick = () => setNow(campusNow());
        tick();
        const interval = setInterval(tick, 60_000);
        return () => clearInterval(interval);
    }, []);

    return now;
}
