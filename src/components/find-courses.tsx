"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Course, Subject, subjects, Term, terms } from "@/utils/course";
import { useEffect, useMemo, useState } from "react";
import { RecommendationInput } from "./recommendations-input";
import { Checkbox } from "@/components/ui/checkbox";
import Fuse from "fuse.js";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@uidotdev/usehooks";
import Link from "next/link";
import { ClassSession } from "@/utils/course";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSchedule } from "@/store/schedule";
import { useToast } from "@/hooks/use-toast";
import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
    Accordion,
} from "./ui/accordion";

const NUM_COURSE_LEVELS = 9;
const ALL_COURSE_LEVELS = Array.from({ length: NUM_COURSE_LEVELS }, (_, i) =>
    ((i + 1) * 1000).toString()
);
const MAX_NUM_COURSES = 10;

type CourseFilter = {
    terms: Term[];
    courseLevels: string[]; // 1000, 2000, 3000, 4000...
    subjectCodes: string[]; // CSCI, MATH, etc.
    searchTerm: string;
};

export function FindCourses({ courses }: { courses: Course[] }) {
    const [maxNumCourses, setMaxNumCourses] = useState(MAX_NUM_COURSES);
    const [filter, setFilter] = useState<CourseFilter>({
        terms: Object.keys(terms),
        courseLevels: ALL_COURSE_LEVELS,
        subjectCodes: [],
        searchTerm: "",
    });

    const fuse = useMemo(() => {
        return new Fuse(courses, {
            includeScore: true,
            keys: ["subjectCode", "courseCode", "title"],
        });
    }, [courses]);

    const debouncedFilter = useDebounce(filter, 300);

    const filteredCourses = useMemo(() => {
        const filter = debouncedFilter;
        const fuzzySearchedCourses = filter.searchTerm
            ? fuse.search(filter.searchTerm).map((result) => result.item)
            : courses;
        const filteredCourses = fuzzySearchedCourses.filter((course) => {
            const hasSelectedTerm = course.termClasses.some((termClass) => {
                return filter.terms.includes(termClass.term);
            });
            const hasSelectedCourseLevel = filter.courseLevels.includes(
                course.courseCode[0] + "000"
            );
            const hasSelectedSubjectCode = filter.subjectCodes.includes(
                course.subjectCode
            );
            return (
                hasSelectedTerm &&
                hasSelectedCourseLevel &&
                hasSelectedSubjectCode
            );
        });

        return filteredCourses.slice(0, maxNumCourses);
    }, [courses, debouncedFilter, fuse, maxNumCourses]);

    useEffect(() => {
        const storedFilter = localStorage.getItem("filter");
        if (storedFilter) {
            setFilter(JSON.parse(storedFilter));
        }
    }, []);

    const handleCheckFilter =
        (key: Exclude<keyof CourseFilter, "searchTerm">, value: string) =>
        (checked: boolean) => {
            const newFilter = { ...filter };
            if (checked) {
                newFilter[key] = [...(newFilter[key] ?? []), value];
            } else {
                newFilter[key] = newFilter[key]?.filter((v) => v !== value);
            }
            localStorage.setItem("filter", JSON.stringify(newFilter));
            setFilter(newFilter);
        };

    const handleAddSubjectCode = (subject: Subject) => {
        const newFilter = { ...filter };
        if (newFilter.subjectCodes.includes(subject.code)) {
            newFilter.subjectCodes = newFilter.subjectCodes.filter(
                (code) => code !== subject.code
            );
        } else {
            newFilter.subjectCodes = [...newFilter.subjectCodes, subject.code];
        }
        localStorage.setItem("filter", JSON.stringify(newFilter));
        setFilter(newFilter);
    };

    const handleRemoveSubjectCode = (subjectCode: string) => {
        const newFilter = { ...filter };
        newFilter.subjectCodes = newFilter.subjectCodes.filter(
            (code) => code !== subjectCode
        );
        localStorage.setItem("filter", JSON.stringify(newFilter));
        setFilter(newFilter);
    };

    const handleClearAllSubjectCodes = () => {
        const newFilter = { ...filter };
        newFilter.subjectCodes = [];
        localStorage.setItem("filter", JSON.stringify(newFilter));
        setFilter(newFilter);
    };

    const handleSelectAllCourseLevels = () => {
        const newFilter = { ...filter };
        newFilter.courseLevels = ALL_COURSE_LEVELS;
        localStorage.setItem("filter", JSON.stringify(newFilter));
        setFilter(newFilter);
    };

    const handleDeselectAllCourseLevels = () => {
        const newFilter = { ...filter };
        newFilter.courseLevels = [];
        localStorage.setItem("filter", JSON.stringify(newFilter));
        setFilter(newFilter);
    };

    const handleShowMoreCourses = () => {
        setMaxNumCourses((prev) => prev + MAX_NUM_COURSES);
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                    className="pl-10 w-full"
                    value={filter.searchTerm}
                    onChange={(e) =>
                        setFilter((prev) => ({
                            ...prev,
                            searchTerm: e.target.value,
                        }))
                    }
                    placeholder="Search for course name, code, or subject code"
                />
            </div>

            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        Filter Courses
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <Label className="text-lg font-semibold mb-2 block">
                                Course Levels
                            </Label>
                            <div className="mb-2 flex gap-2 items-center">
                                <Button
                                    size="sm"
                                    onClick={handleSelectAllCourseLevels}
                                >
                                    Select All
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleDeselectAllCourseLevels}
                                >
                                    Deselect All
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

                        <div>
                            <Label className="text-lg font-semibold mb-2 block">
                                Terms
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

                        <div className="md:col-span-2 lg:col-span-1">
                            <Label className="text-lg font-semibold mb-2 block">
                                Subject Codes
                            </Label>
                            <div className="flex justify-between items-center mb-2">
                                <Button
                                    size="sm"
                                    onClick={handleClearAllSubjectCodes}
                                >
                                    Clear All
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
                                                "bg-slate-100":
                                                    isCurrentSelected,
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
                </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
                {filteredCourses.map((course) => (
                    <CourseCard
                        key={course.subjectCode + course.courseCode}
                        course={course}
                    />
                ))}
            </div>

            {filteredCourses.length >= maxNumCourses && (
                <div className="flex justify-center mt-4">
                    <Button onClick={handleShowMoreCourses}>Show More</Button>
                </div>
            )}
        </div>
    );
}

function CourseCard({ course }: { course: Course }) {
    const { addTimeSlot, removeTimeSlot, timeSlots } = useSchedule();
    const { toast } = useToast();

    const handleToggleTimeSlot = (termClass: ClassSession) => () => {
        const isAdded = timeSlots.some((ts) => ts.class.crn === termClass.crn);
        if (isAdded) {
            removeTimeSlot(termClass.crn);
            toast({
                title: "Class Removed",
                description: `${course.subjectCode} ${course.courseCode} - ${termClass.section} has been removed from your schedule.`,
            });
        } else {
            addTimeSlot(termClass);
            toast({
                title: "Class Added",
                description: `${course.subjectCode} ${course.courseCode} - ${termClass.section} has been added to your schedule.`,
            });
        }
    };

    const addedTermClasses = course.termClasses.filter((termClass) =>
        timeSlots.some((ts) => ts.class.crn === termClass.crn)
    );
    const unaddedTermClasses = course.termClasses.filter(
        (termClass) => !timeSlots.some((ts) => ts.class.crn === termClass.crn)
    );

    const TermClassCard = ({
        termClass,
        isAdded,
    }: {
        termClass: ClassSession;
        isAdded: boolean;
    }) => (
        <div key={termClass.crn} className="bg-slate-100/50 rounded-lg">
            <CardHeader>
                <div className="flex flex-wrap justify-between items-center mb-2">
                    <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                        <span className="font-semibold">
                            {termClass.section}
                        </span>
                        <Badge variant="outline">{termClass.type}</Badge>
                    </div>
                    <Badge>{terms[termClass.term]}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                {termClass.time?.start && termClass.time?.start !== "C/D" ? (
                    <>
                        <div className="text-sm text-muted-foreground mb-2">
                            {termClass.days.join(", ")} •{" "}
                            {termClass.time?.start} - {termClass.time?.end}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                            Location: {termClass.location}
                        </div>

                        <Button
                            variant={isAdded ? "destructive" : "default"}
                            size="sm"
                            onClick={handleToggleTimeSlot(termClass)}
                            className="w-max mt-2"
                        >
                            {isAdded
                                ? "Remove from Schedule"
                                : "Add to Schedule"}
                        </Button>
                    </>
                ) : (
                    <div className="text-sm text-muted-foreground mb-2">
                        {termClass.location}
                    </div>
                )}
            </CardContent>
        </div>
    );

    return (
        <Card className="w-full h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-primary/10 flex-grow">
                <CardTitle className="text-xl font-bold">
                    <Link
                        href={`/${course.subjectCode}${course.courseCode}`}
                        className="hover:underline"
                    >
                        {course.subjectCode} {course.courseCode} -{" "}
                        {course.title}
                    </Link>
                </CardTitle>
                <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary">
                        {course.creditHours} Credit Hours
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-4 flex-grow">
                <p
                    dangerouslySetInnerHTML={{
                        __html: course.description,
                    }}
                    className="text-muted-foreground mb-4"
                ></p>
                {addedTermClasses.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="font-semibold mb-2">Added Classes</h3>
                        {addedTermClasses.map((termClass) => (
                            <TermClassCard
                                key={termClass.crn}
                                termClass={termClass}
                                isAdded={true}
                            />
                        ))}
                    </div>
                )}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="classes">
                        <AccordionTrigger>Available Classes</AccordionTrigger>
                        <AccordionContent>
                            <div className="grid md:grid-cols-2 gap-2 grid-cols-1">
                                {unaddedTermClasses.map((termClass) => (
                                    <TermClassCard
                                        key={`${termClass.crn}-${termClass.section}-${termClass.term}-${course.courseCode}-${course.subjectCode}`}
                                        termClass={termClass}
                                        isAdded={false}
                                    />
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}
