"use client";
import { ScheduleBackground, ScheduleTimeslot } from "@/components/schedule";
import { ClassSession } from "@/utils/course";
import { SearchIcon } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

export function BuildingSchedules({
    buildings,
}: {
    buildings: Record<string, ClassSession[]>;
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const buildingNames = useMemo(() => Object.keys(buildings), [buildings]);

    const refreshRecommendations = useCallback(() => {
        const newRecommendations = buildingNames.filter((building) =>
            building.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setRecommendations(newRecommendations);
    }, [searchTerm, buildingNames]);

    const filteredBuildings = useMemo(() => {
        return Object.entries(buildings).reduce(
            (acc, [building, termClasses]) => {
                if (
                    !building.toLowerCase().includes(searchTerm.toLowerCase())
                ) {
                    return acc;
                }
                acc[building] = termClasses;
                return acc;
            },
            {} as Record<string, ClassSession[]>
        );
    }, [buildings, searchTerm]);

    useEffect(() => {
        if (searchTerm) {
            refreshRecommendations();
        }
    }, [searchTerm, refreshRecommendations]);

    const handleFocus = () => {
        setRecommendations(buildingNames.slice(0, 5));
    };

    const handleBlur = () => {
        setRecommendations([]);
    };

    const handleSelectRecommendation = (building: string) => {
        console.log(building);
        setSearchTerm(building);
        setRecommendations([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            setRecommendations([]);
        }
    };

    return (
        <div>
            <div
                onKeyDown={handleKeyDown}
                className="relative px-2 shadow-black rounded-xl w-full border-2 border-slate-200 bg-white"
            >
                <div className="relative flex-grow">
                    <SearchIcon
                        className="absolute top-1/2 left-0 transform -translate-y-1/2"
                        size={18}
                    />
                    <Input
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for building and room number"
                        className="file:text-base focus-visible:ring-0 translate-x-6 p-0 rounded-none shadow-none outline-none border-none"
                    />
                </div>
                <div
                    className={cn("overflow-y-auto w-full flex flex-col", {
                        "rounded-b-2xl z-[9999] border-b-2 border-l-2 border-r-2 border-slate-200 bg-white absolute left-0 top-[33px] px-2":
                            true,
                    })}
                    style={{
                        maxHeight: recommendations.length ? "300px" : 0,
                        opacity: recommendations.length ? 1 : 0,
                        transition: "max-height height 0.2s",
                    }}
                >
                    {recommendations.map((rec, index) => {
                        return (
                            <div
                                key={index}
                                onClick={() => handleSelectRecommendation(rec)}
                                className="cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                            >
                                {rec}
                            </div>
                        );
                    })}
                </div>
            </div>
            {Object.entries(filteredBuildings)
                .slice(0, 5)
                .map(([building, termClasses]) => (
                    <div key={building}>
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">
                            {building}
                        </h3>

                        <ScheduleBackground>
                            {termClasses.map((termClass, index) => (
                                <Fragment key={index}>
                                    {termClass.days.map((day) => (
                                        <ScheduleTimeslot
                                            key={termClass.section + day}
                                            day={day}
                                            termClass={termClass}
                                            color={"red"}
                                            termClasses={termClasses}
                                            index={index}
                                            course={""}
                                        />
                                    ))}
                                </Fragment>
                            ))}
                        </ScheduleBackground>
                    </div>
                ))}
        </div>
    );
}
