import { courses } from "@/lib/course-utils";
import { ExploreCourses } from "../../components/explore-courses";

export default function Home() {
    return (
        <main className="flex justify-center">
            <section className="w-full sm:w-3/4 sm:m-8 m-2">
                <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">
                    Explore Dalhousie&apos;s Courses
                </h2>
                <ExploreCourses courses={Object.values(courses)} />
            </section>
        </main>
    );
}
