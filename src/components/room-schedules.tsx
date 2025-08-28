"use client";
import type { ClassSession, Day, Term } from "@/lib/types";
import { Building2, Calendar, Clock } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { RecommendationInput } from "./recommendations-input";
import { useStoredState } from "@/hooks/use-stored-state";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { ScheduleBackground } from "./schedule-background";
import { ScheduleTimeslot } from "./schedule-timeslot";
import { colors, getDay } from "@/lib/schedule-utils";
import { days, terms } from "@/lib/course-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export function RoomSchedules({
    rooms,
}: {
    rooms: Record<string, ClassSession[]>;
}) {
    const [selectedRoom, setSelectedRoom] = useStoredState<string | null>(
        null,
        "selected-room"
    );
    const [term, setTerm] = useStoredState<Term>("202530", "term");
    const [view, setView] = useState<"schedule" | "list">("schedule");

    const roomNames = useMemo(() => Object.keys(rooms), [rooms]);
    const roomClasses = useMemo(() => {
        if (!selectedRoom) return null;
        return rooms[selectedRoom].filter(
            (termClass) => termClass.term === term
        );
    }, [rooms, selectedRoom, term]);

    const handleSelectRecommendation = (building: string) => {
        setSelectedRoom(building);
    };

    // Group classes by day for list view
    const classesByDay = useMemo(() => {
        if (!roomClasses) return null;

        const result: Record<string, ClassSession[]> = {};

        days.forEach((day) => {
            result[day] = roomClasses.filter((cls) => cls.days.includes(day));
        });

        return result;
    }, [roomClasses]);

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-[1fr_auto] gap-4 items-end">
                <div className="space-y-2">
                    <Label
                        htmlFor="room-search"
                        className="text-sm font-medium text-slate-700 dark:text-gray-300"
                    >
                        Find a Room
                    </Label>
                    <RecommendationInput
                        allItems={roomNames}
                        numOfRecommendations={40}
                        onSelect={handleSelectRecommendation}
                        autoFocus
                        storageKey="room-schedules"
                        renderRecommendation={(building, isCurrentSelected) => (
                            <div
                                className={cn(
                                    "flex items-center text-sm gap-2 w-full focus:outline-none hover:bg-slate-100 py-2 px-3 rounded-md cursor-pointer dark:hover:bg-gray-700",
                                    isCurrentSelected &&
                                        "bg-slate-100 dark:bg-gray-700"
                                )}
                            >
                                <Building2
                                    size={16}
                                    className="text-slate-500"
                                />
                                <span className="font-medium">{building}</span>
                            </div>
                        )}
                        isHoveredList
                        placeholder="Search for a room..."
                    />
                </div>

                {selectedRoom && (
                    <div className="w-full md:w-48">
                        <Label
                            htmlFor="term-select"
                            className="text-sm font-medium text-slate-700 dark:text-gray-300"
                        >
                            Term
                        </Label>
                        <Select
                            onValueChange={(term: Term) => setTerm(term)}
                            value={term}
                        >
                            <SelectTrigger
                                id="term-select"
                                className="dark:bg-gray-900"
                            >
                                <SelectValue
                                    placeholder={`Select ${terms[term]}`}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(terms).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>
                                        {value}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {selectedRoom && (
                <Tabs
                    value={view}
                    onValueChange={(v) => setView(v as "schedule" | "list")}
                    className="w-auto"
                >
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100">
                                    {selectedRoom}
                                </h2>
                                <p className="text-slate-500 text-sm flex items-center gap-1 dark:text-gray-300">
                                    <Calendar size={14} />
                                    <span>{terms[term]}</span>
                                </p>
                            </div>

                            <TabsList>
                                <TabsTrigger value="schedule">
                                    Schedule View
                                </TabsTrigger>
                                <TabsTrigger value="list">
                                    List View
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden dark:border-gray-700 dark:bg-gray-900">
                            <TabsContent value="schedule" className="m-0">
                                <div className="p-4 overflow-x-auto">
                                    <ScheduleBackground>
                                        {roomClasses?.map(
                                            (termClass, index) => (
                                                <Fragment key={index}>
                                                    {termClass.days.map(
                                                        (day) => (
                                                            <ScheduleTimeslot
                                                                key={
                                                                    termClass.section +
                                                                    day
                                                                }
                                                                day={day}
                                                                termClass={
                                                                    termClass
                                                                }
                                                                color={
                                                                    colors[
                                                                        index %
                                                                            colors.length
                                                                    ]
                                                                }
                                                                termClasses={roomClasses.filter(
                                                                    (c) =>
                                                                        c.term ===
                                                                        term
                                                                )}
                                                                index={index}
                                                                course={
                                                                    termClass.course
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </Fragment>
                                            )
                                        )}
                                    </ScheduleBackground>
                                </div>
                            </TabsContent>

                            <TabsContent value="list" className="m-0">
                                {classesByDay &&
                                    Object.entries(classesByDay).map(
                                        ([day, classes]) => (
                                            <div
                                                key={day}
                                                className="border-b border-slate-200 last:border-0 dark:border-gray-700"
                                            >
                                                <div className="px-6 py-3 bg-slate-50 font-medium text-slate-700 dark:bg-gray-800 dark:text-gray-300">
                                                    {getDay(day as Day)}
                                                </div>

                                                {classes.length > 0 ? (
                                                    <div className="divide-y divide-slate-100 dark:divide-gray-700">
                                                        {classes.map(
                                                            (cls, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="px-6 py-4 flex items-center justify-between"
                                                                >
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {
                                                                                cls.course
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="flex items-center gap-1"
                                                                        >
                                                                            <Clock
                                                                                size={
                                                                                    12
                                                                                }
                                                                            />
                                                                            {
                                                                                cls
                                                                                    .time
                                                                                    .start
                                                                            }{" "}
                                                                            -{" "}
                                                                            {
                                                                                cls
                                                                                    .time
                                                                                    .end
                                                                            }
                                                                        </Badge>
                                                                        <Badge variant="secondary">
                                                                            {
                                                                                cls.section
                                                                            }
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="px-6 py-4 text-slate-500 italic dark:text-gray-400">
                                                        No classes scheduled
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            )}

            {!selectedRoom && (
                <Card className="mt-8 bg-slate-50 border-dashed">
                    <CardHeader>
                        <CardTitle>No Room Selected</CardTitle>
                        <CardDescription>
                            Search for a room above to view its schedule
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center py-8">
                        <Building2 className="h-16 w-16 text-slate-300" />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
