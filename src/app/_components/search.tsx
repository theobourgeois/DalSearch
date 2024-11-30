"use client";
import * as React from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Course, CourseByCode } from "@/utils/course";
import { RecommendationInput } from "./recommendations-input";
import { cn } from "@/lib/utils";

export function Search({
    courses,
    isOnHeader = false,
    numberOfRecommendations = 50,
}: {
    courses: CourseByCode;
    isOnHeader?: boolean;
    numberOfRecommendations?: number;
}) {
    const router = useRouter();
    const pathname = usePathname();

    const handleSelect = (course: Course) => {
        router.push(`/${course.subjectCode}${course.courseCode}`);
    };

    // dont show header search bar on home page
    if (pathname === "/" && isOnHeader) {
        return <></>;
    }

    return (
        <div className="flex flex-col gap-2 items-center w-full">
            <RecommendationInput
                allItems={Object.values(courses)}
                numOfRecommendations={numberOfRecommendations}
                fuzzyKeys={["subjectCode", "courseCode", "title"]}
                onSelect={handleSelect}
                renderRecommendation={(course, isCurrentSelected) => (
                    <Link
                        className={cn(
                            "flex items-center text-sm gap-1 w-full focus:outline-none hover:bg-slate-100 py-1",

                            isCurrentSelected && "bg-slate-100"
                        )}
                        href={`/${course.subjectCode}${course.courseCode}`}
                    >
                        <SearchIcon size={14} />
                        {course.subjectCode} {course.courseCode} -{" "}
                        {course.title}
                    </Link>
                )}
                transformItem={(course) =>
                    course.subjectCode + course.courseCode
                }
                hasSubmitButton={!isOnHeader}
                isHoveredList={isOnHeader}
            />
        </div>
    );
}
