import { courses } from "@/utils/course";
import { Search } from "./_components/combobox";
import { createCourseGraph } from "@/utils/course-graph";

export default function Home() {
  const graph = createCourseGraph("CSCI");
  console.log(graph);
  return (
    <main className="w-screen flex justify-center items-center h-screen flex-col">
      <section className="w-1/2 m-8">
        <Search courses={courses} />
      </section>
    </main>
  );
}
