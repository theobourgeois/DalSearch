"use client";
import { useSchedule } from "@/store/schedule-store";
import { TermClassCard } from "./course-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Search, PlusCircle } from "lucide-react";
import { Input } from "./ui/input";
import { useMemo, useState } from "react";
import {
    currentTerm,
    Term,
    terms,
    type ClassSession,
    type Course,
} from "@/lib/course-utils";
import { useDebounce } from "@uidotdev/usehooks";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";

const MAX_NUM_COURSES = 10;

export function ManageSchedule({ courses }: { courses: Course[] }) {
    const { timeSlots, removeTimeSlot, addTimeSlot } = useSchedule();
    const [input, setInput] = useState("");
    const [term, setTerm] = useState(currentTerm);
    const debouncedInput = useDebounce(input, 300);
    const [activeTab, setActiveTab] = useState("schedule");

    const filteredCourses = useMemo(() => {
        if (debouncedInput === "") return [];
        return courses
            .filter(
                (course) =>
                    course.title
                        .toLowerCase()
                        .includes(debouncedInput.toLowerCase()) ||
                    course.courseCode
                        .toLowerCase()
                        .includes(debouncedInput.toLowerCase()) ||
                    course.subjectCode
                        .toLowerCase()
                        .includes(debouncedInput.toLowerCase())
            )
            .reduce((acc, course) => {
                const termClasses = course.termClasses.filter(
                    (termClass) =>
                        termClass?.term === term &&
                        termClass?.time?.start !== "C/D"
                );
                if (termClasses.length > 0) {
                    acc.push({ ...course, termClasses });
                }
                return acc;
            }, [] as Course[])
            .slice(0, MAX_NUM_COURSES);
    }, [courses, debouncedInput, term]);

    const handleToggleTimeSlot = (termClass: ClassSession) => {
        const isAdded = timeSlots.some((ts) => ts.class.crn === termClass.crn);
        if (isAdded) {
            removeTimeSlot(termClass.crn);
        } else {
            addTimeSlot(termClass);
        }
    };

    return (
        <div className="bg-background h-full">
            <Tabs
                defaultValue="schedule"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="grid grid-cols-2 mb-6">
                    <TabsTrigger value="schedule">Edit Classes</TabsTrigger>
                    <TabsTrigger value="add">Add Classes</TabsTrigger>
                </TabsList>

                <TabsContent value="schedule" className="pt-2 px-2">
                    {timeSlots.length > 0 ? (
                        <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                            {timeSlots.map((timeSlot) => (
                                <TermClassCard
                                    key={timeSlot.class.crn}
                                    termClass={timeSlot.class}
                                    isAdded
                                    onToggleTimeSlot={(termClass) =>
                                        removeTimeSlot(termClass.crn)
                                    }
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                            <PlusCircle className="h-10 w-10 mb-2 opacity-20" />
                            <p>No classes added to your schedule yet.</p>
                            <p className="text-sm">
                                Switch to the &quot;Add Classes&quot; tab to
                                search and add classes.
                            </p>
                            <button
                                onClick={() => setActiveTab("add")}
                                className="mt-4 text-primary hover:underline"
                            >
                                Go to Add Classes
                            </button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="add" className="pt-2 px-2">
                    <div className="space-y-5">
                        <div>
                            <Label>Term</Label>
                            <Select
                                value={term}
                                onValueChange={(term) => setTerm(term as Term)}
                            >
                                <SelectTrigger>
                                    <SelectValue>{terms[term]}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(terms).map(
                                        ([key, value]) => (
                                            <SelectItem value={key} key={key}>
                                                {value}
                                            </SelectItem>
                                        )
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                className="pl-10 w-full rounded-full h-10"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Search for course name, code, or subject code"
                            />
                        </div>

                        <div className="max-h-[700px] overflow-y-auto pr-1">
                            {filteredCourses.length > 0 ? (
                                <div className="space-y-6">
                                    {filteredCourses.map((course) => (
                                        <div
                                            key={
                                                course.courseCode +
                                                course.subjectCode
                                            }
                                            className="space-y-3"
                                        >
                                            <h2 className="text-xl font-bold sticky top-0 bg-background py-2 border-b bg-white dark:bg-gray-900">
                                                {course.subjectCode +
                                                    " " +
                                                    course.courseCode}
                                                <span className="ml-2 text-base font-normal text-muted-foreground">
                                                    {course.title}
                                                </span>
                                            </h2>
                                            <div className="space-y-3">
                                                {course.termClasses.map(
                                                    (termClass) => (
                                                        <TermClassCard
                                                            key={termClass.crn}
                                                            termClass={
                                                                termClass
                                                            }
                                                            isAdded={timeSlots.some(
                                                                (ts) =>
                                                                    ts.class
                                                                        .crn ===
                                                                    termClass.crn
                                                            )}
                                                            onToggleTimeSlot={
                                                                handleToggleTimeSlot
                                                            }
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : debouncedInput ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>
                                        No courses found matching &quot;
                                        {debouncedInput}&quot;
                                    </p>
                                    <p className="text-sm mt-1">
                                        Try a different search term
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Search className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                    <p>Start typing to search for courses</p>
                                    <p className="text-sm mt-1">
                                        Search by course name, code, or subject
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
