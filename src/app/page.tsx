import { courses } from "@/utils/course";
import { Search } from "../components/search";

export default function Home() {
    return (
        <main className="w-full min-h-screen flex justify-center items-center flex-col px-4 bg-gradient-to-b from-blue-50 to-white">
            <section className="w-full max-w-3xl text-center mb-8 mt-8">
                <h1 className="text-4xl font-bold mb-4 text-gray-800">
                    Discover Dalhousie&apos;s Courses
                </h1>
                <p className="text-xl text-gray-600 mb-6">
                    Search through Dalhousie&apos;s course offerings to find the
                    courses you need to complete your degree requirements
                </p>
            </section>
            <section className="w-full max-w-2xl">
                <Search courses={courses} />
            </section>
            <section className="w-full max-w-3xl mt-12 mb-8 text-center">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Why Use Our Course Searcher?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <h3 className="font-semibold mb-2 text-gray-700">
                            Comprehensive
                        </h3>
                        <p className="text-gray-600">
                            Access course information, prerequisites, schedules,
                            and more
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <h3 className="font-semibold mb-2 text-gray-700">
                            User-Friendly
                        </h3>
                        <p className="text-gray-600">
                            Intuitive search interface for easy course discovery
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <h3 className="font-semibold mb-2 text-gray-700">
                            Open Source
                        </h3>
                        <p className="text-gray-600">
                            Contribute to and improve our platform for everyone
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
