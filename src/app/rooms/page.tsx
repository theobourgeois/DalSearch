import { RoomSchedules } from "@/components/room-schedules";
import { ClassSession, courses } from "@/utils/course";

const EXCLUDED_ROOMS = [
    " C/D, C/D",
    "Online-ASYNCHRONOUS SESSION",
    "Online-SYNCHRONOUS SESSION",
];

function getRooms() {
    return Object.values(courses).reduce((acc, course) => {
        course.termClasses.forEach((termClass) => {
            if (
                !termClass.location ||
                EXCLUDED_ROOMS.includes(termClass.location) ||
                !termClass.time.start ||
                !termClass.time.end
            ) {
                return;
            }
            if (!acc[termClass.location]) {
                acc[termClass.location] = [];
            }
            acc[termClass.location].push(termClass);
        });
        return acc;
    }, {} as Record<string, ClassSession[]>);
}

export default function Rooms() {
    const rooms = getRooms();

    return (
        <main className="flex justify-center">
            <section className="w-4/5 sm:w-3/4 m-8">
                <h2 className="text-4xl font-bold mb-4 text-gray-800">
                    Explore Dalhousie&apos;s Rooms
                </h2>
                <RoomSchedules rooms={rooms} />
            </section>
        </main>
    );
}
