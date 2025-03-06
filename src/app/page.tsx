import { courses } from "@/lib/course-utils";
import { Search } from "../components/search";
import { RecentSearches } from "@/components/recent-searches";

export default function Home() {
    return (
        <main className="w-full min-h-screen flex justify-center items-center flex-col px-4 bg-gradient-to-b from-blue-50 to-white dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-800">
            <section className="w-full max-w-3xl text-center mb-8 mt-8">
                <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                    Discover Dalhousie&apos;s Courses
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                    Search through Dalhousie&apos;s course offerings to find the
                    courses you need to complete your degree requirements
                </p>
            </section>
            <section className="w-full max-w-2xl">
                <Search courses={courses} />
            </section>
            <section className="w-full">
                <RecentSearches />
            </section>
            <section className="w-full max-w-3xl mt-12 mb-8 text-center">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                    Why Use Our Course Searcher?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md dark:shadow-lg">
                        <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">
                            Comprehensive
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Access course information, prerequisites, schedules,
                            and more
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md dark:shadow-lg">
                        <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">
                            User-Friendly
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Intuitive search interface for easy course discovery
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md dark:shadow-lg">
                        <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">
                            Open Source
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Contribute to and improve our platform for everyone
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
