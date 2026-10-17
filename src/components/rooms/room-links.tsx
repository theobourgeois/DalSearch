"use client";

import Link from "next/link";
import { useHref } from "@/components/university";
import type { Term } from "@/lib/constants";
import { describeFreeUntil, type FreeRoom } from "@/lib/rooms";

/** A room's schedule, relative to the university: pass it through useHref. */
export function roomHref(roomId: string, term: Term): string {
    return `/rooms?${new URLSearchParams({ room: roomId, term })}`;
}

/** Rooms that are free right now, each linking to its schedule. */
export function FreeRoomList({ rooms, term }: { rooms: FreeRoom[]; term: Term }) {
    const pagePath = useHref();
    if (rooms.length === 0)
        return <p className="text-sm text-fg-subtle">Every room we know about is booked right now.</p>;

    return (
        <ul className="flex flex-col gap-2.5">
            {rooms.map(({ room, until }) => (
                <li key={room.id}>
                    <Link href={pagePath(roomHref(room.id, term))} className="block w-fit hover:underline">
                        <span className="block text-[14.5px] font-bold">{room.name}</span>
                        <span className="block text-[13px] font-medium text-success">{describeFreeUntil(until)}</span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
