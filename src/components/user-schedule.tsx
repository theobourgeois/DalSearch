"use client";

import { useSchedule } from "@/store/schedule";
import { Fragment, useEffect, useRef } from "react";
import { ScheduleBackground, ScheduleTimeslot } from "./schedule";

export default function UserSchedule() {
    const scheduleRef = useRef<HTMLDivElement>(null);
    const { timeSlots, setContainer, term } = useSchedule();
    const filteredTimeSlots = timeSlots.filter(
        (timeSlot) => timeSlot.class.term === term
    );

    useEffect(() => {
        if (scheduleRef.current) {
            setContainer(scheduleRef.current);
        }
    }, [scheduleRef, setContainer]);

    return (
        <div ref={scheduleRef}>
            <ScheduleBackground>
                {filteredTimeSlots.map((timeSlot, index) => (
                    <Fragment key={index}>
                        {timeSlot.class.days.map((day) => (
                            <ScheduleTimeslot
                                key={timeSlot.class.crn + day}
                                course={timeSlot.class.course}
                                day={day}
                                termClass={timeSlot.class}
                                termClasses={timeSlots
                                    .map((c) => c.class)
                                    .filter(
                                        (c) => c.term === timeSlot.class.term
                                    )}
                                color={timeSlot.color}
                                index={index}
                            />
                        ))}
                    </Fragment>
                ))}
            </ScheduleBackground>
        </div>
    );
}
