import { BuildingSchedules } from "@/components/building-schedules";
import { ClassSession, courses } from "@/utils/course";

const EXCLUDED_BUILDINGS = [
    " C/D, C/D",
    "Online-ASYNCHRONOUS SESSION",
    "Online-SYNCHRONOUS SESSION",
];

export default function Buildings() {
    const buildings = Object.values(courses).reduce((acc, course) => {
        course.termClasses.forEach((termClass) => {
            if (
                !termClass.location ||
                EXCLUDED_BUILDINGS.includes(termClass.location) ||
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

    return (
        <main className="flex justify-center">
            <section className="w-4/5 sm:w-3/4 m-8">
                <h2 className="text-4xl font-bold mb-4 text-gray-800">
                    Explore Dalhousie&apos;s Buildings
                </h2>
                <BuildingSchedules buildings={buildings} />
            </section>
        </main>
    );
}
