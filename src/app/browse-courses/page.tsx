import { courses } from "@/utils/course";
import { FindCourses } from "../../components/find-courses";

export default function Home() {
    return (
        <main className="flex justify-center">
            <section className="w-4/5 sm:w-3/4 m-8">
                <h2 className="text-4xl font-bold mb-4 text-gray-800">
                    Explore Dalhousie&apos;s Courses
                </h2>
                <FindCourses courses={Object.values(courses)} />
            </section>
        </main>
    );
}
