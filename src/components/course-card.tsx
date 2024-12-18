import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSchedule } from "@/store/schedule";
import { Course, ClassSession, terms } from "@/utils/course";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { Clock, MapPin, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

const DEFAULT_VISIBLE_CLASSES = 4;

export function CourseCard({
    course,
    showDescription = true,
}: {
    course: Course;
    showDescription?: boolean;
}) {
    const { addTimeSlot, removeTimeSlot, timeSlots } = useSchedule();
    const { toast } = useToast();
    const [visibleClasses, setVisibleClasses] = useState(
        DEFAULT_VISIBLE_CLASSES
    );

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
        <div
            key={termClass.crn}
            className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
        >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 px-2 py-1 rounded-full">
                        <span className="text-sm font-medium text-primary">
                            {termClass.section}
                        </span>
                    </div>
                    <Badge variant="outline" className="uppercase">
                        {termClass.type}
                    </Badge>
                    <Badge variant="outline" className="uppercase">
                        CRN: {termClass.crn}
                    </Badge>
                </div>
                <Badge variant="secondary">{terms[termClass.term]}</Badge>
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
                            <span className="text-sm">
                                {termClass.location}
                            </span>
                        </div>
                        <Button
                            variant={isAdded ? "destructive" : "default"}
                            size="sm"
                            onClick={handleToggleTimeSlot(termClass)}
                            className="w-full mt-2"
                        >
                            {isAdded
                                ? "Remove from Schedule"
                                : "Add to Schedule"}
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <Badge variant="outline">Online</Badge>
                    </div>
                )}
            </div>
        </div>
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
