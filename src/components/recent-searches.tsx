"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export type RecentCourse = {
    subjectCode: string;
    courseCode: string;
    title: string;
};

export function RecentSearchHandler({
    recentCourse,
}: {
    recentCourse: RecentCourse;
}) {
    useEffect(() => {
        const storedSearches = localStorage.getItem("recentSearches");
        if (storedSearches) {
            const searches = JSON.parse(storedSearches) as RecentCourse[];
            const filteredSearches = searches.filter(
                (search) =>
                    search.subjectCode !== recentCourse.subjectCode ||
                    search.courseCode !== recentCourse.courseCode
            );
            const updatedSearches = [recentCourse, ...filteredSearches].slice(
                0,
                10
            ); // Keep only 10 most recent
            localStorage.setItem(
                "recentSearches",
                JSON.stringify(updatedSearches)
            );
        } else {
            localStorage.setItem(
                "recentSearches",
                JSON.stringify([recentCourse])
            );
        }
    }, [recentCourse]);

    return null;
}

export function RecentSearches() {
    const [recentSearches, setRecentSearches] = useState<RecentCourse[]>([]);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const storedSearches = localStorage.getItem("recentSearches");
        if (storedSearches) {
            setRecentSearches(JSON.parse(storedSearches));
        }
    }, []);

    const displayedSearches = showAll
        ? recentSearches
        : recentSearches.slice(0, 5);

    const handleDelete = (index: number) => {
        const updatedSearches = recentSearches.filter((_, i) => i !== index);
        setRecentSearches(updatedSearches);
        localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
    };

    if (recentSearches.length === 0) {
        return null;
    }

    return (
        <div className="md:w-3/4 w-11/12 mx-auto max-w-2xl mt-4 border-gray-200 bg-white drop-shadow-md border p-4 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white">
            <h2 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-200">
                Recent Searches
            </h2>
            <ul className="space-y-1">
                {displayedSearches.map((course, index) => (
                    <li
                        key={index}
                        className="flex items-center justify-between text-sm text-gray-600 hover:bg-gray-100 rounded px-2 py-1 transition-colors dark:hover:bg-gray-700 dark:text-white"
                    >
                        <Link
                            href={`/${course.subjectCode}${course.courseCode}`}
                            className="flex-grow hover:underline"
                        >
                            <span className="font-medium">
                                {course.subjectCode} {course.courseCode}
                            </span>{" "}
                            - {course.title}
                        </Link>
                        <button
                            onClick={() => handleDelete(index)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                            aria-label="Delete search"
                        >
                            <X size={16} />
                        </button>
                    </li>
                ))}
            </ul>
            {recentSearches.length > 5 && (
                <Button
                    onClick={() => setShowAll(!showAll)}
                    className="mt-2 text-xs"
                    variant="ghost"
                    size="sm"
                >
                    {showAll ? "Show Less" : "Show All"}
                </Button>
            )}
        </div>
    );
}
