"use client";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import { useSchedule } from "@/store/schedule-store";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { ClassSession } from "@/lib/types";

export async function getUserSchedule(
    netid: string,
    password: string
): Promise<ClassSession[]> {
    const tokenEndpoint = "/api/dalonline-token";
    const tokenRes = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            netid: netid,
            password: password,
        }),
    });
    if (!tokenRes.ok) {
        throw new Error("Failed to get token: " + tokenRes.statusText);
    }

    const token = await tokenRes.json();
    if (!token) {
        throw new Error("Failed to get token");
    }

    const scheduleEndpoint = "/api/user-schedule";
    const scheduleRes = await fetch(scheduleEndpoint, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        },
        body: JSON.stringify({}),
    });

    if (!scheduleRes.ok) {
        throw new Error("Failed to get schedule: " + scheduleRes.statusText);
    }

    const schedule = await scheduleRes.json();
    return schedule;
}

export function ImportSchedule() {
    const { setTimeSlots } = useSchedule();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const netid = e.currentTarget.netid.value;
            const password = e.currentTarget.password.value;
            const schedule = await getUserSchedule(netid, password);
            setTimeSlots(schedule);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <div>
                <Label>Net ID</Label>
                <Input
                    placeholder="Enter your net id (without @dal.ca)"
                    name="netid"
                />
            </div>
            <div>
                <Label>Password</Label>
                <Input
                    placeholder="Enter your password"
                    name="password"
                    type="password"
                />
            </div>
            <Button type="submit" className="mt-2" disabled={loading}>
                {loading ? <Loader2 /> : "Import"}
            </Button>
        </form>
    );
}
