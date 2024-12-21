"use client";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    CourseFilter,
    creditHours,
    Subject,
    subjects,
    Term,
    terms,
} from "@/utils/course";
import { RecommendationInput } from "./recommendations-input";
import { Badge } from "@/components/ui/badge";
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";

const ALL_COURSE_LEVELS = Array.from({ length: 9 }, (_, i) =>
    ((i + 1) * 1000).toString()
);

export function CourseFilterDrawer({
    filter,
    onFilterUpdate,
    isOpen,
    onOpenChange,
}: {
    filter: CourseFilter;
    onFilterUpdate: (newFilter: Partial<CourseFilter>) => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
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
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                    <Filter className="w-5 h-5" />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[40vh]">
                <DrawerHeader>
                    <DrawerTitle className="text-3xl">
                        Filter Courses
                    </DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto px-4 space-y-6">
                    <div className="flex flex-col md:flex-row gap-4">
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
                            <div className="flex gap-2">
                                {Array.from({ length: 3 }, (_, i) => {
                                    return (
                                        <div
                                            key={i}
                                            className="flex flex-col gap-2"
                                        >
                                            {ALL_COURSE_LEVELS.slice(
                                                i * 3,
                                                i * 3 + 3
                                            ).map((courseLevel) => (
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
                                                    <Label
                                                        htmlFor={`level-${courseLevel}`}
                                                    >
                                                        {courseLevel}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <Separator orientation="vertical" />

                        <div>
                            <Label className="text-lg font-semibold mb-2 block">
                                Terms
                            </Label>
                            <div className="flex gap-4 flex-wrap">
                                {Object.entries(terms).map(
                                    ([term, termName]) => (
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
                                    )
                                )}
                            </div>
                        </div>
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
                    </div>

                    <Separator />

                    <div>
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
                            renderRecommendation={(
                                subject,
                                isCurrentSelected
                            ) => (
                                <div
                                    className={cn(
                                        `flex cursor-pointer hover:bg-slate-100 items-center text-sm gap-2 w-full focus:outline-none py-2 px-2 rounded-lg`,
                                        {
                                            "bg-slate-100": isCurrentSelected,
                                        }
                                    )}
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
                        <div className="flex flex-wrap gap-2 mt-2">
                            {filter.subjectCodes.map((subjectCode) => (
                                <TooltipProvider key={subjectCode}>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Badge
                                                variant="secondary"
                                                className="flex items-center gap-1"
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
                                                        code.code ===
                                                        subjectCode
                                                )?.description
                                            }
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                    </div>
                </div>
                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
