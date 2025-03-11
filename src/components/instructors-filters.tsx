"use client";

import { ArrowDown, ListOrdered, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

interface InstructorsFiltersProps {
    ratingFilter: number | null;
    setRatingFilter: (rating: number | null) => void;
    orderBy: {
        key: "name" | "rating" | "courses";
        direction: "asc" | "desc";
    };
    setOrderBy: (orderBy: {
        key: "name" | "rating" | "courses";
        direction: "asc" | "desc";
    }) => void;
}

const orderByOptions = [
    { key: "name", label: "Name" },
    { key: "rating", label: "Rating" },
    { key: "courses", label: "Number of Courses" },
];

const ratingOptions = [
    { value: null, label: "All Ratings" },
    { value: 4, label: "4+ Stars" },
    { value: 3, label: "3+ Stars" },
    { value: 2, label: "2+ Stars" },
    { value: 1, label: "1+ Stars" },
];

export function InstructorsFilters({
    ratingFilter,
    setRatingFilter,
    orderBy,
    setOrderBy,
}: InstructorsFiltersProps) {
    return (
        <div className="flex justify-end">
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center justify-center rounded-full p-[7px] bg-white hover:bg-gray-100 transition-colors border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                    <ListOrdered className="w-5 h-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Order by</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {orderByOptions.map((option) => (
                        <DropdownMenuItem
                            key={option.key}
                            className="flex items-center justify-between"
                            onClick={() =>
                                setOrderBy({
                                    key: option.key as
                                        | "name"
                                        | "rating"
                                        | "courses",
                                    direction:
                                        orderBy.key === option.key
                                            ? orderBy.direction === "asc"
                                                ? "desc"
                                                : "asc"
                                            : "asc",
                                })
                            }
                        >
                            {option.label}
                            {orderBy.key === option.key && (
                                <ArrowDown
                                    className={cn(
                                        "w-4 h-4 ml-2",
                                        orderBy.direction === "asc"
                                            ? "transform rotate-180"
                                            : ""
                                    )}
                                />
                            )}
                        </DropdownMenuItem>
                    ))}

                    <DropdownMenuSeparator />

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center">
                            <Star className="w-4 h-4 mr-2" />
                            <span>Minimum Rating</span>
                            {ratingFilter !== null && (
                                <span className="ml-1 text-xs bg-primary/20 text-primary rounded-full px-2 py-0.5">
                                    {ratingFilter}+
                                </span>
                            )}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            {ratingOptions.map((option) => (
                                <DropdownMenuItem
                                    key={option.value?.toString() || "all"}
                                    className="flex items-center justify-between"
                                    onClick={() =>
                                        setRatingFilter(option.value)
                                    }
                                >
                                    {option.label}
                                    {ratingFilter === option.value && (
                                        <span className="ml-2">✓</span>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
