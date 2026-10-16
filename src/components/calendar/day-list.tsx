import Link from "next/link";
import { tintStyle } from "@/lib/colors";
import { dayNames } from "@/lib/constants";
import { calendarDays, type CalendarEvent } from "@/lib/calendar";
import { formatMinutes } from "@/lib/time";
import { cn } from "@/lib/utils";

/** The same events as the week calendar, listed day by day. */
export function DayList({ events }: { events: CalendarEvent[] }) {
    return (
        <div className="flex flex-col">
            {calendarDays(events).map((day) => {
                const dayEvents = events.filter((event) => event.day === day).sort((a, b) => a.start - b.start);
                return (
                    <section key={day} className="border-b border-line py-4 last:border-b-0">
                        <h3 className="mb-2 text-[13px] font-bold text-fg-subtle">{dayNames[day].long}</h3>
                        {dayEvents.length === 0 ? (
                            <p className="text-sm text-fg-subtle">No classes</p>
                        ) : (
                            <ul className="flex flex-col gap-1">
                                {dayEvents.map((event) => {
                                    const content = (
                                        <>
                                            <span className="w-24 shrink-0 text-sm font-bold text-fg-muted">
                                                {formatMinutes(event.start)}-{formatMinutes(event.end)}
                                            </span>
                                            <span
                                                className="size-2 shrink-0 rounded-full bg-fg-subtle"
                                                style={event.color ? { backgroundColor: event.color } : undefined}
                                            />
                                            <span className="min-w-0 truncate text-sm">
                                                <b className="font-bold">{event.title}</b>
                                                {event.lines?.length ? (
                                                    <span className="ml-2 text-fg-muted">{event.lines.join(", ")}</span>
                                                ) : null}
                                            </span>
                                        </>
                                    );
                                    const className = cn(
                                        "flex items-center gap-3 rounded-row px-3 py-2.5",
                                        event.conflict && "ring-[1.5px] ring-inset ring-danger",
                                        event.href && "hover:bg-raised",
                                    );
                                    return (
                                        <li
                                            key={event.id}
                                            style={
                                                event.variant === "tinted" && event.color
                                                    ? tintStyle(event.color, 0.1)
                                                    : undefined
                                            }
                                            className="rounded-row"
                                        >
                                            {event.href ? (
                                                <Link href={event.href} className={className}>
                                                    {content}
                                                </Link>
                                            ) : (
                                                <div className={className}>{content}</div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                );
            })}
        </div>
    );
}
