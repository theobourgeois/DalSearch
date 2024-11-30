import { courses } from "@/utils/course";
import { FindCourses } from "../_components/find-courses";

export default function Home() {
    return (
        <main className="flex justify-center">
            <section className="w-3/4">
                <FindCourses courses={Object.values(courses)} />
            </section>
        </main>
    );
}
