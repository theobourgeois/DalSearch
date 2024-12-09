"use client";

import { useSchedule } from "@/store/schedule";
import { Fragment, useRef } from "react";
import { ScheduleBackground, ScheduleTimeslot } from "./schedule";

export default function UserSchedule() {
    const scheduleRef = useRef<HTMLDivElement>(null);
    const { timeSlots } = useSchedule();

    return (
        <div ref={scheduleRef}>
            <div className="overflow-x-auto">
                <ScheduleBackground>
                    {timeSlots.map((timeSlot, index) => (
                        <Fragment key={index}>
                            {timeSlot.class.days.map((day) => (
                                <ScheduleTimeslot
                                    key={timeSlot.class.crn + day}
                                    course={timeSlot.class.course}
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
        </div>
    );
}
