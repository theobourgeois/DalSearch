import { forwardRef } from "react";
import Link from "next/link";
import { tintStyle } from "@/lib/colors";
import { dayNames } from "@/lib/constants";
import { calendarDays, hourRange, layoutDay, type CalendarEvent, type PositionedEvent } from "@/lib/calendar";
import { formatMinutes, type CampusNow } from "@/lib/time";
import { cn } from "@/lib/utils";

const variantStyles: Record<CalendarEvent["variant"], string> = {
    neutral: "bg-block text-fg-muted",
    tinted: "text-fg-muted",
    accent: "bg-accent text-accent-fg/75",
    ghost: "border-[1.5px] border-dashed border-fg-subtle text-fg-muted",
};

/** Vertical padding plus the title line, and the height of each extra line, in px. */
const TITLE_HEIGHT = 30;
const LINE_HEIGHT = 16.5;

/** How many secondary lines fit under the title, so short blocks never show half a line. */
const linesThatFit = (height: number) => Math.max(0, Math.floor((height - TITLE_HEIGHT) / LINE_HEIGHT));

function EventBlock({ event, top, height }: { event: PositionedEvent; top: number; height: number }) {
    const style = {
        top,
        height,
        left: `calc(${(event.lane / event.lanes) * 100}% + 3px)`,
        width: `calc(${100 / event.lanes}% - 6px)`,
        ...(event.variant === "tinted" && event.color ? tintStyle(event.color, 0.22) : {}),
    };
    const className = cn(
        "absolute overflow-hidden rounded-block px-2.5 py-1.5 text-left text-xs leading-snug transition-[filter]",
        variantStyles[event.variant],
        event.conflict && "ring-[1.5px] ring-inset ring-danger",
        (event.href || event.onSelect) && "hover:brightness-[0.97] dark:hover:brightness-110",
    );
    const content = (
        <>
            <span
                className={cn(
                    "flex items-center gap-1.5 truncate text-[12.5px] font-bold",
                    event.variant === "accent" ? "text-accent-fg" : "text-fg",
                )}
            >
                {event.variant === "neutral" && event.color && (
                    <span className="size-[7px] shrink-0 rounded-full" style={{ backgroundColor: event.color }} />
                )}
                <span className="truncate">{event.title}</span>
            </span>
            {event.lines?.slice(0, linesThatFit(height)).map((line) => (
                <span key={line} className="block truncate">
                    {line}
                </span>
            ))}
        </>
    );

    if (event.href) {
        return (
            <Link href={event.href} style={style} className={className} aria-label={event.label}>
                {content}
            </Link>
        );
    }
    if (event.onSelect) {
        return (
            <button type="button" onClick={event.onSelect} style={style} className={className} aria-label={event.label}>
                {content}
            </button>
        );
    }
    return (
        <div style={style} className={className} aria-label={event.label}>
            {content}
        </div>
    );
}

type WeekCalendarProps = {
    events: CalendarEvent[];
    /** Show how many classes each day has next to its name. */
    showCounts?: boolean;
    /** Draws a "now" line on the matching day. */
    now?: CampusNow;
    pxPerMinute?: number;
    className?: string;
};

/** A Monday-to-Friday timetable (Saturday is added when needed) with overlapping events side by side. */
export const WeekCalendar = forwardRef<HTMLDivElement, WeekCalendarProps>(
    ({ events, showCounts, now, pxPerMinute = 0.95, className }, ref) => {
        const days = calendarDays(events);
        const [firstHour, lastHour] = hourRange(events);
        const origin = firstHour * 60;
        const height = (lastHour - firstHour) * 60 * pxPerMinute;
        const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, index) => firstHour + index);
        const showNow = now?.day && now.minutes > origin && now.minutes < lastHour * 60;

        return (
            <div className={cn("overflow-x-auto", className)}>
                <div
                    ref={ref}
                    className="grid min-w-[640px] bg-panel pb-2"
                    style={{ gridTemplateColumns: `2.75rem repeat(${days.length}, minmax(0, 1fr))` }}
                >
                    <div />
                    {days.map((day) => {
                        const count = events.filter((event) => event.day === day).length;
                        return (
                            <div key={day} className="h-[30px] truncate pl-2 text-[13px] font-bold text-fg-muted">
                                {dayNames[day].short}
                                {showCounts && count > 0 && (
                                    <span className="ml-1.5 font-medium text-fg-subtle">{`${count} ${count === 1 ? "class" : "classes"}`}</span>
                                )}
                            </div>
                        );
                    })}

                    <div className="relative" style={{ height }}>
                        {hours.map((hour) => (
                            <span
                                key={hour}
                                className="absolute right-2.5 -translate-y-1/2 text-xs font-medium text-fg-subtle"
                                style={{ top: (hour * 60 - origin) * pxPerMinute }}
                            >
                                {hour}
                            </span>
                        ))}
                    </div>

                    {days.map((day) => (
                        <div
                            key={day}
                            className="relative border-l border-line"
                            style={{
                                height,
                                backgroundImage: "linear-gradient(var(--line) 1px, transparent 1px)",
                                backgroundSize: `100% ${60 * pxPerMinute}px`,
                            }}
                        >
                            {layoutDay(events.filter((event) => event.day === day)).map((event) => (
                                <EventBlock
                                    key={event.id}
                                    event={event}
                                    top={(event.start - origin) * pxPerMinute + 1}
                                    height={(event.end - event.start) * pxPerMinute - 2}
                                />
                            ))}
                            {showNow && now.day === day && (
                                <div
                                    className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                                    style={{ top: (now.minutes - origin) * pxPerMinute }}
                                    aria-label={`Now, ${formatMinutes(now.minutes)}`}
                                >
                                    <span className="-ml-1 size-2 rounded-full bg-accent" />
                                    <span className="h-0.5 flex-1 bg-accent" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    },
);
WeekCalendar.displayName = "WeekCalendar";
