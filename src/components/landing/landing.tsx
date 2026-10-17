import Image from "next/image";
import Link from "next/link";
import { WeekCalendar } from "@/components/calendar/week-calendar";
import { textOn } from "@/lib/accent";
import type { LandingData } from "@/lib/landing";
import { universityPath } from "@/lib/university";
import { formatNumber } from "@/lib/utils";
import {
    AccountNote,
    intro,
    LandingFooter,
    LandingHeader,
    Questions,
    RequestSchool,
    schools,
    weekEvents,
} from "./parts";

/** The landing page: the schools as tiles in their own colours, then a real week and what the site answers. */
export function Landing({ counts, week }: LandingData) {
    const events = week ? weekEvents(week) : [];
    return (
        <div className="min-h-screen bg-canvas">
            <LandingHeader />
            <main className="mx-auto max-w-[76rem] px-5 sm:px-8">
                <section className="grid items-end gap-x-14 gap-y-6 pb-12 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:pt-16">
                    <h1 className="max-w-[12ch] text-balance text-[48px] font-black leading-[0.98] tracking-display sm:text-[76px]">
                        Plan your courses in one tab.
                    </h1>
                    <p className="text-[17px] leading-relaxed text-fg-body">{intro}</p>
                </section>

                <section aria-labelledby="schools" className="pb-20">
                    <h2 id="schools" className="text-[15px] font-bold text-fg-muted">
                        Pick your school
                    </h2>
                    <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {schools.map((school) => (
                            <li key={school.id}>
                                <Link
                                    href={universityPath(school.id, "/")}
                                    className="flex h-full min-h-[150px] flex-col justify-between gap-4 rounded-card p-5 transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                                    style={{ backgroundColor: school.accent, color: textOn(school.accent) }}
                                >
                                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white">
                                        <Image
                                            src={school.logo}
                                            alt=""
                                            width={26}
                                            height={26}
                                            unoptimized
                                            className="size-[26px] object-contain"
                                        />
                                    </span>
                                    <span>
                                        <span className="block text-[17px] font-bold leading-tight">{school.name}</span>
                                        {counts[school.id] > 0 && (
                                            <span className="mt-1 block text-[13px] opacity-75">
                                                {formatNumber(counts[school.id])} courses
                                            </span>
                                        )}
                                    </span>
                                </Link>
                            </li>
                        ))}
                        <li>
                            <a
                                href="#request"
                                className="flex h-full min-h-[150px] flex-col justify-end rounded-card border-[1.5px] border-dashed border-line-strong p-5 text-fg-muted transition-colors hover:text-fg"
                            >
                                <span className="text-[17px] font-bold leading-tight">Don&apos;t see yours?</span>
                                <span className="mt-1 text-[13px]">Ask us to add it</span>
                            </a>
                        </li>
                    </ul>
                </section>

                <section className="grid gap-x-14 gap-y-12 border-t border-line py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
                    {week && events.length > 0 && (
                        <figure className="min-w-0">
                            <div className="overflow-hidden rounded-panel border border-line bg-panel p-3 sm:p-4">
                                <WeekCalendar events={events} pxPerMinute={0.75} />
                            </div>
                            <figcaption className="mt-3 px-1 text-[13px] leading-relaxed text-fg-subtle">
                                A first-year week at Dalhousie, {week.termName}, from real sections on this term&apos;s
                                timetable.
                            </figcaption>
                        </figure>
                    )}
                    <Questions className="!grid-cols-1 gap-y-8" />
                </section>
                <AccountNote className="pb-12" />
                <RequestSchool className="border-t border-line py-12" />
            </main>
            <LandingFooter />
        </div>
    );
}
