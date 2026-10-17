"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/combobox";
import type { Term } from "@/lib/constants";
import type { Room } from "@/lib/types";
import { roomHref } from "./room-links";
import { useHref } from "@/components/university";

const MAX_RESULTS = 8;

/** Finds a room by building or number and opens its schedule. */
export function RoomSearch({ rooms, term, size = "md" }: { rooms: Room[]; term: Term; size?: "md" | "lg" }) {
    const pagePath = useHref();
    const router = useRouter();
    const [query, setQuery] = useState("");
    // A real room from this university, to show how its rooms are named.
    const example = rooms[Math.floor(rooms.length / 2)]?.name;
    const matches = useMemo(() => {
        const words = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (words.length === 0) return [];
        return rooms
            .filter(({ name }) => words.every((word) => name.toLowerCase().includes(word)))
            .slice(0, MAX_RESULTS);
    }, [rooms, query]);

    return (
        <Combobox
            className="w-full max-w-xl"
            size={size}
            query={query}
            onQueryChange={setQuery}
            items={matches}
            getKey={(match) => match.id}
            onSelect={(match) => {
                setQuery("");
                router.push(pagePath(roomHref(match.id, term)));
            }}
            label="Search rooms"
            placeholder={example ? `Search a building or room, like ${example}` : "Search a building or room"}
            renderItem={(match) => (
                <>
                    <span className="min-w-0 flex-1 truncate font-bold">{match.name}</span>
                    {match.campus && <span className="shrink-0 text-[13px] text-fg-subtle">{match.campus}</span>}
                </>
            )}
        />
    );
}
