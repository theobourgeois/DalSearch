"use client";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { creditHours, subjects, terms } from "@/lib/course-utils";
import { RecommendationInput } from "./recommendations-input";
import { Badge } from "@/components/ui/badge";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import type { CourseFilter, Subject, Term } from "@/lib/types";
import { X } from "lucide-react";

const ALL_COURSE_LEVELS = Array.from({ length: 9 }, (_, i) =>
    ((i + 1) * 1000).toString()
);

export function CourseFilterPanel({
    filter,
    onFilterUpdate,
}: {
    filter: CourseFilter;
    onFilterUpdate: (newFilter: Partial<CourseFilter>) => void;
}) {
    const handleCheckFilter =
        (key: keyof CourseFilter, value: string | number) =>
        (checked: boolean) => {
            const currentValues = filter[key] as string[];
            const newValues = checked
                ? [...currentValues, value]
                : currentValues.filter((v) => v !== value);

            onFilterUpdate({ [key]: newValues });
        };

    const handleAddSubjectCode = (subject: Subject) => {
        const currentSubjectCodes = filter.subjectCodes;
        const newSubjectCodes = currentSubjectCodes.includes(subject.code)
            ? currentSubjectCodes.filter((code) => code !== subject.code)
            : [...currentSubjectCodes, subject.code];

        onFilterUpdate({ subjectCodes: newSubjectCodes });
    };

    const handleRemoveSubjectCode = (subjectCode: string) => {
        const newSubjectCodes = filter.subjectCodes.filter(
            (code) => code !== subjectCode
        );
        onFilterUpdate({ subjectCodes: newSubjectCodes });
    };

    const handleClearAllSubjectCodes = () => {
        onFilterUpdate({ subjectCodes: [] });
    };

    const handleSelectAllSubjectCodes = () => {
        const allSubjectCodes = subjects.map((subject) => subject.code);
        onFilterUpdate({ subjectCodes: allSubjectCodes });
    };

    const handleSelectAllCourseLevels = () => {
        onFilterUpdate({ courseLevels: ALL_COURSE_LEVELS });
    };

    const handleDeselectAllCourseLevels = () => {
        onFilterUpdate({ courseLevels: [] });
    };

    const handleSelectAllCreditHours = () => {
        onFilterUpdate({ creditHours });
    };

    const handleDeselectAllCreditHours = () => {
        onFilterUpdate({ creditHours: [] });
    };

    return (
        <div className="border dark:border-gray-700 bg-white p-4 dark:bg-gray-800 h-min md:w-80 w-full shadow-md rounded-md">
            <div className="flex w-full gap-6 md:flex-col flex-wrap flex-row pb-8">
                <div>
                    <Label className="text-lg font-semibold mb-2 block">
                        Course Levels
                    </Label>
                    <div className="mb-2 flex gap-2 items-center">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSelectAllCourseLevels}
                        >
                            Select All
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDeselectAllCourseLevels}
                        >
                            Deselect All
                        </Button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {ALL_COURSE_LEVELS.map((courseLevel) => (
                            <div
                                key={courseLevel}
                                className="flex items-center space-x-2"
                            >
                                <Checkbox
                                    id={`level-${courseLevel}`}
                                    checked={filter.courseLevels.includes(
                                        courseLevel
                                    )}
                                    onCheckedChange={handleCheckFilter(
                                        "courseLevels",
                                        courseLevel
                                    )}
                                />
                                <Label htmlFor={`level-${courseLevel}`}>
                                    {courseLevel}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator className="hidden md:block" />

                <div>
                    <Label className="text-lg font-semibold mb-2 block">
                        Terms
                    </Label>
                    <div className="flex gap-4 flex-wrap">
                        {Object.entries(terms).map(([term, termName]) => (
                            <div
                                key={term}
                                className="flex items-center space-x-2"
                            >
                                <Checkbox
                                    id={`term-${term}`}
                                    checked={filter.terms.includes(
                                        term as Term
                                    )}
                                    onCheckedChange={handleCheckFilter(
                                        "terms",
                                        term
                                    )}
                                />
                                <Label htmlFor={`term-${term}`}>
                                    {termName}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator className="hidden md:block" />

                <div>
                    <Label className="text-lg font-semibold mb-2 block">
                        Credit Hours
                    </Label>
                    <div className="mb-2 flex gap-2 items-center">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSelectAllCreditHours}
                        >
                            Select All
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDeselectAllCreditHours}
                        >
                            Deselect All
                        </Button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {creditHours.map((creditHour) => (
                            <div
                                key={creditHour}
                                className="flex items-center space-x-2"
                            >
                                <Checkbox
                                    checked={filter.creditHours?.includes(
                                        creditHour
                                    )}
                                    onCheckedChange={handleCheckFilter(
                                        "creditHours",
                                        creditHour
                                    )}
                                />
                                <Label>{creditHour}</Label>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator className="hidden md:block" />

                <div className="w-full">
                    <Label className="text-lg font-semibold mb-2 block">
                        Subject Codes
                    </Label>
                    <div className="flex gap-2 items-center mb-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleClearAllSubjectCodes}
                        >
                            Clear All
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSelectAllSubjectCodes}
                        >
                            Select All
                        </Button>
                    </div>
                    <RecommendationInput
                        showAllItemsByDefault
                        placeholder="Search for a subject code.."
                        isHoveredList
                        allItems={subjects}
                        fuzzyKeys={["code", "description"]}
                        onSelect={handleAddSubjectCode}
                        closeOnSelect={false}
                        numOfRecommendations={subjects.length}
                        renderRecommendation={(subject, isCurrentSelected) => (
                            <div
                                className={cn(
                                    "flex cursor-pointer hover:bg-gray-100 items-center text-sm gap-2 w-full focus:outline-none py-2 px-2 rounded-lg dark:hover:bg-gray-700 dark:bg-gray-800 dark:text-white",
                                    {
                                        "bg-gray-100": isCurrentSelected,
                                    }
                                )}
                                onClick={() => handleAddSubjectCode(subject)}
                            >
                                <Checkbox
                                    checked={filter.subjectCodes.includes(
                                        subject.code
                                    )}
                                    onCheckedChange={() =>
                                        handleAddSubjectCode(subject)
                                    }
                                />
                                {subject.description}
                            </div>
                        )}
                    />
                    <div className="flex flex-wrap gap-2 mt-2 max-h-60 items-start overflow-y-auto">
                        {filter.subjectCodes.map((subjectCode) => (
                            <TooltipProvider key={subjectCode}>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge
                                            variant="secondary"
                                            className="flex items-center gap-1 dark:bg-gray-200 dark:text-gray-800 dark:hover:bg-gray-300"
                                        >
                                            {subjectCode}
                                            <X
                                                className="h-3 w-3 cursor-pointer"
                                                onClick={() =>
                                                    handleRemoveSubjectCode(
                                                        subjectCode
                                                    )
                                                }
                                            />
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {
                                            subjects.find(
                                                (code) =>
                                                    code.code === subjectCode
                                            )?.description
                                        }
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
