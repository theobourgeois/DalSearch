"use client";
import {
    ClassSession,
    CourseAndSubjectCode,
    CourseByCode,
    Term,
    terms,
} from "@/utils/course";
import { colors, ScheduleBackground, ScheduleTimeSlot } from "./schedule";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SearchInput } from "./search";
import { Fragment, useEffect, useRef, useState } from "react";
import { ToggleGroup } from "@radix-ui/react-toggle-group";
import { ToggleGroupItem } from "@/components/ui/toggle-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DeleteIcon, Download } from "lucide-react";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Badge } from "@/components/ui/badge";
import html2canvas from "html2canvas";
import { Popover, PopoverArrow, PopoverClose } from "@radix-ui/react-popover";
import { PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import jsPDF from "jspdf";
import Link from "next/link";

export default function ScheduleBuilder({
    courses,
}: {
    courses: CourseByCode;
}) {
    const [classColors, setClassColors] = useState<{
        [key: string]: string;
    }>({});
    const [selectedCourses, setSelectedCourses] = useState<
        {
            term: string;
            course: CourseAndSubjectCode;
        }[]
    >([]);
    const [selectedClasses, setSelectedClasses] = useState<
        { course: CourseAndSubjectCode; class: ClassSession }[]
    >([]);
    const scheduleRef = useRef<HTMLDivElement>(null);

    const handleSelectCourse = (course: CourseAndSubjectCode) => {
        const courseData = courses[course];
        const newSelectedCourses = [...selectedCourses];
        // term with the most classes
        const selectedTerm = Object.keys(courseData.instructorsByTerm).reduce(
            (a, b) => {
                return courseData.instructorsByTerm[a].length >
                    courseData.instructorsByTerm[b].length
                    ? a
                    : b;
            }
        );
        newSelectedCourses.unshift({
            course,
            term: selectedTerm,
        });

        setSelectedCourses(newSelectedCourses);
        const newCourseColors = { ...classColors };
        for (const session of courses[course].termClasses) {
            const index = Object.keys(newCourseColors).length;
            newCourseColors[session.section + session.term + course] =
                colors[index % colors.length];
        }
        setClassColors(newCourseColors);
        localStorage.setItem(
            "selectedCourses",
            JSON.stringify(newSelectedCourses)
        );
        localStorage.setItem("classColors", JSON.stringify(newCourseColors));
    };

    const handleTermChange = (course: CourseAndSubjectCode) => (term: Term) => {
        const newSelectedCouses = selectedCourses.map((c) =>
            c.course === course ? { ...c, term } : c
        );
        setSelectedCourses(newSelectedCouses);
        localStorage.setItem(
            "selectedCourses",
            JSON.stringify(selectedCourses)
        );
    };

    useEffect(() => {
        const selectedCourses = localStorage.getItem("selectedCourses");
        if (selectedCourses) {
            setSelectedCourses(JSON.parse(selectedCourses));
        }
        const selectedClasses = localStorage.getItem("selectedClasses");
        if (selectedClasses) {
            setSelectedClasses(JSON.parse(selectedClasses));
        }
        const classColors = localStorage.getItem("classColors");
        if (classColors) {
            setClassColors(JSON.parse(classColors));
        }
    }, []);

    const handleAddClass =
        (course: CourseAndSubjectCode) => (classIds: string[]) => {
            const classes = classIds.map((id) => {
                const [term, section] = id.split(" ");
                return courses[course].termClasses.find(
                    (c) => c.term === term && c.section === section
                );
            });

            const newSelectedClasses = selectedClasses.filter(
                (c) => c.course !== course
            );
            newSelectedClasses.push(
                ...(classes.map((c) => ({
                    course,
                    class: c,
                })) as typeof newSelectedClasses)
            );

            localStorage.setItem(
                "selectedClasses",
                JSON.stringify(newSelectedClasses)
            );

            setSelectedClasses(newSelectedClasses);
        };

    const handleRemoveClass = (course: CourseAndSubjectCode) => () => {
        const newSelectedClasses = selectedClasses.filter(
            (c) => c.course !== course
        );
        localStorage.setItem(
            "selectedClasses",
            JSON.stringify(newSelectedClasses)
        );
        setSelectedClasses(newSelectedClasses);
        const newSelectedCourses = selectedCourses.filter(
            (c) => c.course !== course
        );
        localStorage.setItem(
            "selectedCourses",
            JSON.stringify(newSelectedCourses)
        );
        setSelectedCourses(newSelectedCourses);
        const newClassColors = { ...classColors };
        for (const session of courses[course].termClasses) {
            delete newClassColors[session.term + session.section + course];
        }
        setClassColors(newClassColors);
    };

    const handleDownloadPng = () => {
        const div = scheduleRef.current!;
        html2canvas(div).then((canvas) => {
            const link = document.createElement("a");
            link.download = "schedule.png";
            link.href = canvas.toDataURL();
            link.click();
        });
    };

    const handleDownloadPdf = () => {
        const div = scheduleRef.current!;
        html2canvas(div).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "px",
                format: [canvas.width, canvas.height],
            });
            pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
            pdf.save("schedule.pdf");
        });
    };

    return (
        <div>
            <Card className="pb-8">
                <CardHeader className="flex justify-between flex-row">
                    <h2 className="text-3xl font-bold mb-4">
                        Schedule Builder (Beta)
                    </h2>
                    <Popover>
                        <PopoverTrigger>
                            <Button variant="ghost">
                                <Download />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <PopoverArrow />
                            <PopoverClose />
                            <Button variant="ghost" onClick={handleDownloadPng}>
                                PNG
                            </Button>
                            <Button variant="ghost" onClick={handleDownloadPdf}>
                                PDF
                            </Button>
                        </PopoverContent>
                    </Popover>
                </CardHeader>
                <CardContent className="flex flex-col">
                    <ResizablePanelGroup direction="horizontal">
                        <ResizablePanel defaultSize={23} minSize={20}>
                            <div className="mr-2">
                                <h3 className="text-xl font-semibold mb-4">
                                    Search for courses
                                </h3>
                                <SearchInput
                                    hoveredList
                                    courses={courses}
                                    onSelect={handleSelectCourse}
                                    numOfRecommendations={10}
                                />
                                <div>
                                    {selectedCourses.map((course) => (
                                        <Card
                                            key={course.course}
                                            className="mt-2"
                                        >
                                            <CardHeader className="flex flex-row justify-between items-start pb-2 pt-4">
                                                <Link
                                                    href={`/${course.course}`}
                                                    className="hover:underline"
                                                >
                                                    <h3 className="text-xl font-semibold">
                                                        {course.course} -{" "}
                                                        {
                                                            courses[
                                                                course.course
                                                            ].title
                                                        }
                                                    </h3>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    onClick={handleRemoveClass(
                                                        course.course
                                                    )}
                                                >
                                                    <DeleteIcon />
                                                </Button>
                                            </CardHeader>
                                            <CardContent className="flex flex-col gap-2">
                                                <Select
                                                    onValueChange={handleTermChange(
                                                        course.course
                                                    )}
                                                    value={course.term}
                                                >
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="Theme" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(
                                                            Object.keys(
                                                                terms
                                                            ) as Term[]
                                                        ).map((semester) => (
                                                            <SelectItem
                                                                key={semester}
                                                                value={semester}
                                                            >
                                                                {
                                                                    terms[
                                                                        semester
                                                                    ]
                                                                }
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <ToggleGroup
                                                    onValueChange={handleAddClass(
                                                        course.course
                                                    )}
                                                    type="multiple"
                                                    className="gap-1 flex flex-wrap"
                                                >
                                                    {courses[
                                                        course.course
                                                    ].termClasses
                                                        .filter(
                                                            (c) =>
                                                                c.term ===
                                                                course.term
                                                        )
                                                        .map((session) => (
                                                            <ToggleGroupItem
                                                                style={{
                                                                    backgroundColor:
                                                                        selectedClasses.some(
                                                                            (
                                                                                c
                                                                            ) =>
                                                                                c.course ===
                                                                                    course.course &&
                                                                                c
                                                                                    .class
                                                                                    .section ===
                                                                                    session.section &&
                                                                                c
                                                                                    .class
                                                                                    .term ===
                                                                                    session.term
                                                                        )
                                                                            ? classColors[
                                                                                  session.section +
                                                                                      session.term +
                                                                                      course.course
                                                                              ] +
                                                                              "80"
                                                                            : "",
                                                                }}
                                                                value={
                                                                    session.term +
                                                                    " " +
                                                                    session.section
                                                                }
                                                                key={
                                                                    session.term +
                                                                    session.section
                                                                }
                                                            >
                                                                {session.type}{" "}
                                                                {
                                                                    session.section
                                                                }
                                                                {session.time
                                                                    .start ===
                                                                    "C/D" && (
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="ml-2"
                                                                    >
                                                                        ONLINE
                                                                    </Badge>
                                                                )}
                                                            </ToggleGroupItem>
                                                        ))}
                                                </ToggleGroup>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </ResizablePanel>
                        <ResizableHandle withHandle />

                        <ResizablePanel minSize={30}>
                            <div ref={scheduleRef} className="overflow-x-auto">
                                <ScheduleBackground>
                                    {selectedClasses.map((termClass, index) => (
                                        <Fragment key={index}>
                                            {termClass.class.days.map((day) => (
                                                <ScheduleTimeSlot
                                                    key={
                                                        termClass.class
                                                            .section +
                                                        termClass.course +
                                                        day
                                                    }
                                                    course={termClass.course}
                                                    day={day}
                                                    termClass={termClass.class}
                                                    classColors={classColors}
                                                    termClasses={selectedClasses.map(
                                                        (c) => c.class
                                                    )}
                                                    index={index}
                                                />
                                            ))}
                                        </Fragment>
                                    ))}
                                </ScheduleBackground>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </CardContent>
            </Card>
        </div>
    );
}
