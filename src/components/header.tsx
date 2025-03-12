import { Building2, Calendar, CompassIcon, Users } from "lucide-react";
import Link from "next/link";
import { Search } from "./search";
import { DarkModeToggle } from "./darkmode-toggle";
import { DalLogo } from "./dal-logo";
import { CourseByCode } from "@/lib/types";

interface Props {
    courses: CourseByCode;
}

export default function Header({ courses }: Props) {
    return (
        <header className="flex flex-col px-6 py-4 shadow-md w-full bg-white sticky top-0 z-10 dark:bg-gray-800 dark:text-white">
            <div className="flex justify-between gap-4 items-start sm:items-center flex-col sm:flex-row">
                <div className="flex items-center gap-1 w-full">
                    <DalLogo />
                    <Link
                        href="/"
                        className="no-underline hover:opacity-90 transition-opacity duration-200"
                    >
                        <h1 className="text-3xl font-extrabold leading-tight text-gray-800">
                            <span className="text-yellow-400">Dal</span>
                            <span className="text-black dark:text-white">
                                Search
                            </span>
                        </h1>
                    </Link>

                    <div className="hidden md:block w-96 ml-2">
                        <Search
                            numberOfRecommendations={5}
                            isOnHeader
                            courses={courses}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        title="Explore Courses"
                        href="/explore"
                        className="flex items-center text-gray-800 hover:text-yellow-400 dark:text-white"
                    >
                        <CompassIcon className="w-6 h-6 hover:text-yellow-400" />
                    </Link>
                    <Link
                        title="Search Rooms"
                        href="/rooms"
                        className="flex items-center text-gray-800 hover:text-yellow-400 dark:text-white"
                    >
                        <Building2 className="w-6 h-6 hover:text-yellow-400" />
                    </Link>
                    <Link
                        title="Schedule"
                        href="/schedule"
                        className="flex items-center text-gray-800 hover:text-yellow-400 dark:text-white"
                    >
                        <Calendar className="w-6 h-6 hover:text-yellow-400" />
                    </Link>
                    <Link
                        title="Instructors"
                        href="/instructors"
                        className="flex items-center text-gray-800 hover:text-yellow-400 dark:text-white"
                    >
                        <Users className="w-6 h-6 hover:text-yellow-400" />
                    </Link>
                    <div className="w-[2px] h-6 dark:bg-gray-400/30 bg-gray-100 rounded-lg" />
                    <DarkModeToggle />
                </div>
            </div>
            <div className="block md:hidden mt-4">
                <Search
                    numberOfRecommendations={5}
                    isOnHeader
                    courses={courses}
                />
            </div>
        </header>
    );
}
