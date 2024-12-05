"use client";

import { useSchedule } from "@/store/schedule";
import { Fragment, useRef } from "react";
import { ScheduleBackground, ScheduleCourse } from "./schedule";

export default function UserSchedule() {
    const scheduleRef = useRef<HTMLDivElement>(null);
    const { timeSlots } = useSchedule();

    return (
        <div ref={scheduleRef}>
            <ScheduleBackground>
                {timeSlots.map((timeSlot, index) => (
                    <Fragment key={index}>
                        {timeSlot.class.days.map((day) => (
                            <ScheduleCourse
                                key={
                                    timeSlot.class.section +
                                    timeSlot.course +
                                    day
                                }
                                course={timeSlot.course}
                                day={day}
                                termClass={timeSlot.class}
                                termClasses={timeSlots.map((c) => c.class)}
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
