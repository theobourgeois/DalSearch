import { CourseByCode } from "@/utils/course";
import { Calendar, CompassIcon, Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "./search";

interface Props {
    courses: CourseByCode;
}

export default function Header({ courses }: Props) {
    return (
        <header className="flex flex-col px-6 py-4 shadow-md w-full bg-white sticky top-0 z-10">
            <div className="flex justify-between tems-center flex-row">
                <div className="flex items-center gap-4 w-full">
                    <Image
                        src="/dal.svg"
                        alt="Dalhousie University Logo"
                        width={48}
                        height={48}
                        className="object-contain"
                    />

                    <Link
                        href="/"
                        className="no-underline hover:opacity-90 transition-opacity duration-200"
                    >
                        <h1 className="text-3xl font-extrabold leading-tight text-gray-800">
                            <span className="text-yellow-400">Dal</span>
                            <span className="text-gray-700">Search</span>
                        </h1>
                    </Link>

                    <div className="hidden md:block w-96">
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
                        href="/browse-courses"
                        className="flex items-center text-gray-800 hover:text-yellow-400"
                    >
                        <CompassIcon className="w-6 h-6 mr-2" />
                        <span className="hidden text-nowrap text-sm md:inline">
                            Explore Courses
                        </span>
                    </Link>
                    <Link
                        title="Schedule Builder"
                        href="/schedule-builder"
                        className="flex items-center text-gray-800 hover:text-yellow-400"
                    >
                        <Calendar className="w-6 h-6 mr-2" />
                        <span className="hidden text-nowrap text-sm md:inline">
                            Schedule Builder (Beta)
                        </span>
                    </Link>
                    <Link
                        title="View source code"
                        href="https://github.com/theobourgeois/DalSearch"
                        className="mr-4"
                    >
                        <Github className="w-6 h-6 text-gray-800 hover:text-yellow-400" />
                    </Link>
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
