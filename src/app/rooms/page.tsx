import type { Metadata } from "next";
import { Page, PageActions, PageHeader, SectionHeader } from "@/components/layout/page";
import { FreeRoomList } from "@/components/rooms/room-links";
import { RoomSchedule } from "@/components/rooms/room-schedule";
import { RoomSearch } from "@/components/rooms/room-search";
import { termCodes, type Term } from "@/lib/constants";
import { getCurrentTerm, getRoomSessions } from "@/lib/data";
import { parseLocation } from "@/lib/location";
import { findFreeRooms, freeWindows, isCampusHours, roomStatus } from "@/lib/rooms";
import { campusNow } from "@/lib/time";

export const metadata: Metadata = {
    title: "Rooms - DalSearch",
    description: "See when any room at Dalhousie is booked, or find one that's free right now.",
};

type Props = { searchParams: Promise<{ room?: string; term?: string }> };

export default async function RoomsPage({ searchParams }: Props) {
    const params = await searchParams;
    const currentTerm = getCurrentTerm();
    const term = termCodes.includes(params.term as Term) ? (params.term as Term) : currentTerm;
    const rooms = getRoomSessions(term);
    const roomNames = [...rooms.keys()].sort();
    const room = params.room && rooms.has(params.room) ? params.room : null;
    const now = campusNow();
    const live = term === currentTerm && isCampusHours(now);

    if (!room) {
        return (
            <Page breadcrumbs={[{ label: "Rooms" }]}>
                <PageHeader
                    title="Rooms"
                    description="See when any room on campus is booked, or find one that's free right now."
                />
                <PageActions>
                    <RoomSearch rooms={roomNames} term={term} size="lg" />
                </PageActions>
                {live && (
                    <section className="mt-11">
                        <SectionHeader title="Free right now" className="mb-4" />
                        <FreeRoomList rooms={findFreeRooms(rooms, now, undefined, 10)} term={term} />
                    </section>
                )}
            </Page>
        );
    }

    const sessions = rooms.get(room) ?? [];
    const location = parseLocation(room);

    return (
        <Page breadcrumbs={[{ label: "Rooms", href: "/rooms" }, { label: location.name }]}>
            <PageHeader title={location.name} subtitle={location.campus ? `${location.campus} campus` : undefined} />
            <PageActions>
                <RoomSearch rooms={roomNames} term={term} />
            </PageActions>
            <RoomSchedule
                room={room}
                sessions={sessions}
                term={term}
                status={live ? roomStatus(sessions, now) : null}
                freeWindows={live && now.day ? freeWindows(sessions, now.day, now.minutes) : []}
                freeRooms={live ? findFreeRooms(rooms, now, room, 4) : []}
            />
        </Page>
    );
}
