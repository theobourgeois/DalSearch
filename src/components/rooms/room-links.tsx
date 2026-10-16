import Link from "next/link";
import type { Term } from "@/lib/constants";
import { formatLocation } from "@/lib/location";
import { describeFreeUntil, type FreeRoom } from "@/lib/rooms";

export function roomHref(room: string, term: Term): string {
    return `/rooms?${new URLSearchParams({ room, term })}`;
}

/** Rooms that are free right now, each linking to its schedule. */
export function FreeRoomList({ rooms, term }: { rooms: FreeRoom[]; term: Term }) {
    if (rooms.length === 0)
        return <p className="text-sm text-fg-subtle">Every room we know about is booked right now.</p>;

    return (
        <ul className="flex flex-col gap-2.5">
            {rooms.map(({ room, until }) => (
                <li key={room}>
                    <Link href={roomHref(room, term)} className="block w-fit hover:underline">
                        <span className="block text-[14.5px] font-bold">{formatLocation(room)}</span>
                        <span className="block text-[13px] font-medium text-success">{describeFreeUntil(until)}</span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
