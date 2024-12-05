import { Metadata } from "next";
import UserSchedule from "../../components/user-schedule";

export const metadata: Metadata = {
    title: "Schedule Builder - DalSearch",
    description: "Schedule Builder for Dalhousie University students.",
};

export default function Page() {
    return (
        <main className="w-full flex justify-center">
            <section className="m-8 w-full">
                <UserSchedule />
            </section>
        </main>
    );
}
