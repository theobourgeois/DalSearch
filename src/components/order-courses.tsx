import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "./ui/dropdown-menu";
import { ArrowDown, ListOrderedIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseOrderBy, CourseOrderByKey } from "@/lib/types";

type OrderByCoursesProps = {
    orderBy: CourseOrderBy;
    onOrderByChange: (orderBy: CourseOrderBy) => void;
};

type OrderByOption = {
    key: CourseOrderByKey;
    label: string;
};

const orderByOptions: OrderByOption[] = [
    { key: "title", label: "Title" },
    { key: "creditHours", label: "Credit Hours" },
    { key: "numClasses", label: "Number of Classes" },
    { key: "courseCode", label: "Course Code" },
];

export function OrderByCourses({
    orderBy,
    onOrderByChange,
}: OrderByCoursesProps) {
    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center justify-center rounded-full p-[7px] bg-white hover:bg-gray-100 transition-colors border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                    <ListOrderedIcon className="w-5 h-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Order by</DropdownMenuLabel>
                    <DropdownMenuSeparator />{" "}
                    {orderByOptions.map((option) => (
                        <DropdownMenuItem
                            key={option.key}
                            className="flex items-center justify-between"
                            onClick={() =>
                                onOrderByChange({
                                    key: option.key,
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
                                        "w-4 h-4",
                                        orderBy.direction === "asc"
                                            ? "transform rotate-180"
                                            : ""
                                    )}
                                />
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
