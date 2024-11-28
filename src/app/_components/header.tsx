import { CourseByCode } from "@/utils/course";
import { Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "./combobox";

interface Props {
    courses: CourseByCode;
}

export default function Header({ courses }: Props) {
    return (
        <header className="flex flex-col px-6 py-4 shadow-md w-full bg-white sticky top-0 z-10">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4 w-full">
                    {/* Logo */}
                    <Image
                        src="/dal.svg"
                        alt="Dalhousie University Logo"
                        width={48}
                        height={48}
                        className="object-contain"
                    />

                    {/* Homepage Link */}
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
                            numOfRecommendations={5}
                            isOnHeader
                            courses={courses}
                        />
                    </div>
                </div>
                <div className="flex items-center">
                    <Link
                        title="View source code"
                        href="https://github.com/theobourgeois/DalSearch"
                        className="mr-4"
                    >
                        <Github className="w-6 h-6 text-gray-800 hover:text-yellow-400" />
                    </Link>
                    {/* <Link
                        title="Schedule Builder"
                        href="/schedule-builder"
                        className="flex items-center text-gray-800 hover:text-yellow-400"
                    >
                        <Calendar className="w-6 h-6 mr-2" />
                        <span className="hidden text-sm md:inline">
                            Schedule Builder
                        </span>
                    </Link> */}
                </div>
            </div>
            <div className="block md:hidden mt-4">
                <Search numOfRecommendations={5} isOnHeader courses={courses} />
            </div>
        </header>
    );
}
