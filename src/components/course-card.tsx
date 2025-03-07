import { useState } from "react";
import { toast } from "sonner";
import { useSchedule } from "@/store/schedule-store";
import { terms } from "@/lib/course-utils";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { Clock, MapPin, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { ClassSession, Course } from "@/lib/types";

function KeywordHighlightedText({
    text,
    keyword,
}: {
    text: string;
    keyword: string;
}) {
    const parts = text.split(new RegExp(`(${keyword})`, "gi"));

    return (
        <span>
            {parts.map((part, index) => (
                <span
                    key={index}
                    className={cn(
                        part.toLowerCase() === keyword.toLowerCase() &&
                            "bg-yellow-300 dark:bg-yellow-500"
                    )}
                >
                    {part}
                </span>
            ))}
        </span>
    );
}

const DEFAULT_VISIBLE_CLASSES = 4;

export const TermClassCard = ({
    termClass,
    showCourse = false,
    isAdded,
    onToggleTimeSlot,
}: {
    termClass: ClassSession;
    isAdded: boolean;
    showCourse?: boolean;
    onToggleTimeSlot?: (termClass: ClassSession) => void;
}) => (
    <div
        key={termClass.crn}
        className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden dark:bg-gray-900 dark:border-gray-700"
    >
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center dark:bg-gray-800 dark:border-gray-700">
            {showCourse && (
                <span className="text-sm font-bold text-primary">
                    {termClass.course}
                </span>
            )}
            <div className="flex items-center space-x-3">
                <div className="bg-primary/10 px-2 py-1 rounded-full flex items-center space-x-2">
                    <span className="text-sm font-medium text-primary">
                        {termClass.section}
                    </span>
                </div>
                <Badge variant="outline" className="uppercase dark:bg-gray-700">
                    {termClass.type}
                </Badge>
                <Badge variant="outline" className="uppercase dark:bg-gray-700">
                    CRN: {termClass.crn}
                </Badge>
            </div>
            <Badge variant="secondary" className="dark:bg-gray-700">
                {terms[termClass.term]}
            </Badge>
        </div>

        <div className="p-4">
            {termClass.time?.start && termClass.time?.start !== "C/D" ? (
                <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                            {termClass.days.join(", ")} •{" "}
                            {termClass.time?.start} - {termClass.time?.end}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{termClass.location}</span>
                    </div>
                    <Button
                        variant={isAdded ? "destructive" : "default"}
                        size="sm"
                        onClick={() => onToggleTimeSlot?.(termClass)}
                        className="w-full mt-2"
                    >
                        {isAdded ? "Remove from Schedule" : "Add to Schedule"}
                    </Button>
                </div>
            ) : (
                <div className="flex items-center space-x-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <Badge variant="outline" className="dark:bg-gray-700">
                        Online
                    </Badge>
                </div>
            )}
        </div>
    </div>
);

export function CourseCard({
    keyword,
    course,
    showDescription = true,
}: {
    keyword: string;
    course: Course;
    showDescription?: boolean;
}) {
    const { addTimeSlot, removeTimeSlot, timeSlots } = useSchedule();
    const [visibleClasses, setVisibleClasses] = useState(
        DEFAULT_VISIBLE_CLASSES
    );

    const handleToggleTimeSlot = (termClass: ClassSession) => {
        const isAdded = timeSlots.some((ts) => ts.class.crn === termClass.crn);
        if (isAdded) {
            removeTimeSlot(termClass.crn);
            toast("Class removed", {
                description: `${course.subjectCode} ${course.courseCode} - ${termClass.section} has been removed from your schedule.`,
            });
        } else {
            addTimeSlot(termClass);
            toast("Class added", {
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

    const handleShowAllClasses = () => {
        if (visibleClasses === unaddedTermClasses.length) {
            setVisibleClasses(DEFAULT_VISIBLE_CLASSES);
            return;
        } else {
            setVisibleClasses(unaddedTermClasses.length);
        }
    };

    return (
        <Card className="w-full h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-gray-800">
            <CardHeader className="bg-primary/10 flex-grow">
                <CardTitle className="text-xl font-bold">
                    <Link
                        href={`/${course.subjectCode}${course.courseCode}`}
                        className="hover:underline"
                    >
                        <KeywordHighlightedText
                            text={`${course.subjectCode} ${course.courseCode} - ${course.title}`}
                            keyword={keyword}
                        />
                    </Link>
                </CardTitle>
                <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className="dark:bg-gray-700">
                        {course.creditHours} Credit Hours
                    </Badge>
                </div>
                {course.prerequisites.length > 0 && (
                    <div>
                        <h2 className="text-base font-semibold mb-1 mt-1">
                            Prerequisites
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {course.prerequisites.map((prereq) => (
                                <Link key={prereq} href={`/${prereq}`}>
                                    <Badge
                                        variant="outline"
                                        className="text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors px-2 py-1 dark:border-gray-700"
                                    >
                                        {prereq}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-grow">
                {showDescription && (
                    <p
                        dangerouslySetInnerHTML={{
                            __html: course.description,
                        }}
                        className="text-muted-foreground mb-4"
                    ></p>
                )}
                {addedTermClasses.length > 0 && (
                    <div className="space-y-2 mb-4">
                        <h3 className="font-semibold mb-2">Added Classes</h3>
                        <div className="grid md:grid-cols-2 gap-2 grid-cols-1">
                            {addedTermClasses.map((termClass) => (
                                <TermClassCard
                                    onToggleTimeSlot={handleToggleTimeSlot}
                                    key={termClass.crn}
                                    termClass={termClass}
                                    isAdded={true}
                                />
                            ))}
                        </div>
                    </div>
                )}
                <h3 className="font-semibold mb-2">Available Classes</h3>
                <div className="grid md:grid-cols-2 gap-2 grid-cols-1">
                    {unaddedTermClasses
                        .slice(0, visibleClasses)
                        .map((termClass) => (
                            <TermClassCard
                                onToggleTimeSlot={handleToggleTimeSlot}
                                key={`${termClass.crn}-${termClass.section}-${termClass.term}-${course.courseCode}-${course.subjectCode}`}
                                termClass={termClass}
                                isAdded={false}
                            />
                        ))}
                </div>
                {unaddedTermClasses.length > visibleClasses && (
                    <div className="flex justify-center mt-4">
                        <Button
                            onClick={handleShowAllClasses}
                            variant="outline"
                        >
                            {visibleClasses === DEFAULT_VISIBLE_CLASSES
                                ? "Show All Classes"
                                : "Show Less Classes"}
                            <ChevronDown className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
