"use client";
import {
    colors,
    ScheduleBackground,
    ScheduleTimeslot,
} from "@/components/schedule";
import { ClassSession, Term, terms } from "@/utils/course";
import { SearchIcon } from "lucide-react";
import { Fragment, useMemo } from "react";
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

export function RoomSchedules({
    rooms,
}: {
    rooms: Record<string, ClassSession[]>;
}) {
    const [selectedRoom, setSelectedRoom] = useStoredState<string | null>(
        null,
        "selected-room"
    );
    const [term, setTerm] = useStoredState<Term>("202520", "term");
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

    return (
        <div>
            <RecommendationInput
                allItems={roomNames}
                numOfRecommendations={10}
                onSelect={handleSelectRecommendation}
                autoFocus
                storageKey="room-schedules"
                renderRecommendation={(building, isCurrentSelected) => (
                    <div
                        className={cn(
                            "flex items-center text-sm gap-1 w-full focus:outline-none hover:bg-slate-200/40 py-1 cursor-pointer",
                            isCurrentSelected && "bg-slate-200/40"
                        )}
                    >
                        <SearchIcon size={14} />
                        {building}
                    </div>
                )}
                isHoveredList
                placeholder="Search for a room..."
            />
            {selectedRoom && (
                <div className="w-max my-2">
                    <Label>Term</Label>
                    <Select
                        onValueChange={(term: Term) => setTerm(term)}
                        value={term}
                    >
                        <SelectTrigger className="bg-white">
                            <SelectValue
                                placeholder={`Select ${terms[term]}`}
                            />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            {Object.entries(terms).map(([key, value]) => (
                                <SelectItem key={key} value={key}>
                                    {value}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {selectedRoom && (
                <div key={selectedRoom}>
                    <h3 className="text-2xl font-bold my-4 text-gray-800">
                        {selectedRoom}
                    </h3>

                    <ScheduleBackground>
                        {roomClasses?.map((termClass, index) => (
                            <Fragment key={index}>
                                {termClass.days.map((day) => (
                                    <ScheduleTimeslot
                                        key={termClass.section + day}
                                        day={day}
                                        termClass={termClass}
                                        color={colors[index % colors.length]}
                                        termClasses={roomClasses.filter(
                                            (c) => c.term === term
                                        )}
                                        index={index}
                                        course={termClass.course}
                                    />
                                ))}
                            </Fragment>
                        ))}
                    </ScheduleBackground>
                </div>
            )}
        </div>
    );
}
