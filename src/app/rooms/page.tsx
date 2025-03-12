import { RoomSchedules } from "@/components/room-schedules";
import { courses } from "@/lib/course-utils";
import type { ClassSession } from "@/lib/types";

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
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-800 mb-2 dark:text-white">
                        Explore Rooms
                    </h1>
                    <p className="text-slate-600 max-w-2xl dark:text-gray-300">
                        Find and view schedules for all rooms across Dalhousie
                        University campuses. Search for a specific room to see
                        its current and upcoming class schedule.
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 dark:bg-gray-800 dark:border-gray-700">
                    <RoomSchedules rooms={rooms} />
                </div>
            </div>
        </main>
    );
}
