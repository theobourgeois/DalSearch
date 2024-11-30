"use client";
import Fuse from "fuse.js";
import * as React from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Course, CourseAndSubjectCode, CourseByCode } from "@/utils/course";
import { cn } from "@/lib/utils";
import ClickAwayListener from "react-click-away-listener";

const NUM_RECOMMENDATIONS = 50;

export function Search({
    courses,
    numOfRecommendations = NUM_RECOMMENDATIONS,
    isOnHeader = false,
}: {
    courses: CourseByCode;
    isOnHeader?: boolean;
    numOfRecommendations?: number;
}) {
    const router = useRouter();
    const pathname = usePathname();

    const handleSelect = (course: CourseAndSubjectCode) => {
        router.push(`/${course}`);
    };

    // dont show header search bar on home page
    if (pathname === "/" && isOnHeader) {
        return <></>;
    }

    return (
        <div className="flex flex-col gap-2 items-center w-full">
            <SearchInput
                isListLinks
                isOnHeader={isOnHeader}
                numOfRecommendations={numOfRecommendations}
                onSelect={handleSelect}
                courses={courses}
                hasButton
                hoveredList={isOnHeader}
            />
        </div>
    );
}

type SearchInputProps = {
    courses: CourseByCode;
    onSelect: (course: CourseAndSubjectCode) => void;
    numOfRecommendations?: number;
    hasButton?: boolean;
    isOnHeader?: boolean;
    isListLinks?: boolean;
    hoveredList?: boolean;
};

export function SearchInput({
    hoveredList = false,
    courses,
    onSelect,
    isOnHeader,
    numOfRecommendations,
    isListLinks = false,
    hasButton = false,
}: SearchInputProps) {
    const pathname = usePathname();

    const [value, setValue] = React.useState("");
    const [recommendations, setRecommendations] = React.useState<
        CourseAndSubjectCode[]
    >([]);

    const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    const open = recommendations.length > 0;
    const fuse = React.useMemo(() => {
        return new Fuse(Object.values(courses), {
            includeScore: true,
            keys: ["subjectCode", "courseCode", "title"],
        });
    }, [courses]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer
        debounceTimerRef.current = setTimeout(() => {
            loadRecommendations(newValue);
        }, 200);
    };

    const loadRecommendations = (value: string) => {
        const results = fuse.search(value);
        const recommendations = results
            .map((result) => result.item)
            .slice(0, numOfRecommendations) as Course[];
        setRecommendations(
            recommendations.map(
                (course) => course.subjectCode + course.courseCode
            ) as CourseAndSubjectCode[]
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            onSelect(recommendations[0]);
            setValue("");
        }
        if (e.key === "Escape") {
            setRecommendations([]);
        }
    };

    React.useEffect(() => {
        setRecommendations([]);
        setValue("");
    }, [pathname]);

    const handleSubmit = () => {
        onSelect(recommendations[0]);
    };

    const handleClickCourse = (course: CourseAndSubjectCode) => () => {
        onSelect(course);
        setRecommendations([]);
    };

    return (
        <>
            <div
                className="relative px-2 shadow-black rounded-xl w-full border-2 border-slate-200"
                onKeyDown={handleKeyDown}
            >
                <div className="relative">
                    <SearchIcon
                        className="absolute top-1/2 left-0 transform -translate-y-1/2"
                        size={18}
                    />
                    <Input
                        className="file:text-base focus-visible:ring-0 translate-x-6 p-0 rounded-none shadow-none outline-none border-none"
                        value={value}
                        onChange={handleChange}
                        placeholder="Search for a course.."
                    />
                </div>
                <ClickAwayListener onClickAway={() => setRecommendations([])}>
                    <div
                        className={cn("overflow-y-auto w-full flex flex-col", {
                            "rounded-b-2xl z-10 border-b-2 border-l-2 border-r-2 border-slate-200 bg-white absolute left-0 top-[33px] px-2":
                                hoveredList,
                        })}
                        style={{
                            maxHeight: open ? "300px" : 0,
                            opacity: open ? 1 : 0,
                            transition: "max-height height 0.2s",
                        }}
                    >
                        {recommendations.map((course) => {
                            if (isListLinks) {
                                return (
                                    <Link
                                        key={course}
                                        className="flex items-center text-sm gap-1 w-full focus:bg-slate-100 focus:outline-none hover:bg-slate-100 py-1"
                                        href={`/${course}`}
                                    >
                                        <SearchIcon size={14} />
                                        {courses[course].subjectCode}{" "}
                                        {courses[course].courseCode} -{" "}
                                        {courses[course].title}
                                    </Link>
                                );
                            }

                            return (
                                <div
                                    key={course}
                                    className="flex items-center text-sm gap-1 w-full focus:bg-slate-100 focus:outline-none hover:bg-slate-100 py-1 cursor-pointer"
                                    onClick={handleClickCourse(course)}
                                    tabIndex={0}
                                >
                                    <SearchIcon size={14} />
                                    {courses[course].subjectCode}{" "}
                                    {courses[course].courseCode} -{" "}
                                    {courses[course].title}
                                </div>
                            );
                        })}
                    </div>
                </ClickAwayListener>
            </div>
            {!isOnHeader && hasButton && (
                <Button
                    onClick={handleSubmit}
                    className="w-max bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                    Search
                </Button>
            )}
        </>
    );
}
