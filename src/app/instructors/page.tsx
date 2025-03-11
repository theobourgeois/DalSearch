import { getAllInstructors } from "@/lib/course-utils";
import { InstructorsPageContent } from "@/components/instructor-page-content";

export default function InstructorsPage() {
    const instructors = getAllInstructors();

    return (
        <main className="py-8 px-4 dark:bg-gray-900 w-screen">
            <div className="space-y-4 max-w-7xl mx-auto w-full">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Instructors
                    </h1>
                    <p className="text-muted-foreground">
                        Browse and search through all available instructors.
                        View their ratings and courses.
                    </p>
                </div>

                <InstructorsPageContent instructors={instructors} />
            </div>
        </main>
    );
}
