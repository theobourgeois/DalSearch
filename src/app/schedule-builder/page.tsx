import { Metadata } from "next";
import ScheduleBuilder from "../_components/schedule-builder";
import { courses } from "@/utils/course";

export const metadata: Metadata = {
    title: "Schedule Builder - DalSearch",
    description: "Schedule Builder for Dalhousie University students.",
};

export default function Page() {
    return (
        <main className="w-full flex justify-center">
            <section className="m-8 w-full">
                <ScheduleBuilder courses={courses} />
            </section>
        </main>
    );
}
