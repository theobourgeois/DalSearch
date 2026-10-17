import type { Metadata } from "next";
import Link from "next/link";
import { WeekCalendar } from "@/components/calendar/week-calendar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UniversityLogo } from "@/components/layout/university-logo";
import { sessionEvents } from "@/lib/calendar";
import { courseColors } from "@/lib/colors";
import { links, SITE_NAME, SITE_URL } from "@/lib/constants";
import { getCourse, getCourseCounts, getCurrentTerm, getTerms } from "@/lib/data";
import { findClashes, formatCourseCode } from "@/lib/schedule";
import { termLabel } from "@/lib/terms";
import type { ClassSession } from "@/lib/types";
import { universities, universityPath } from "@/lib/university";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
    title: { absolute: `${SITE_NAME} - Course search and timetable planning for Canadian universities` },
    description: `Search courses at ${universities.length} Canadian universities, see open seats, instructors and their ratings, and plan a timetable that doesn't clash. Free, no account needed.`,
    alternates: { canonical: "/" },
};

const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: "Course search and timetable planning for Canadian university students.",
};

/** First-year courses Dal runs most terms; the sample week takes the ones on this term's timetable. */
const SAMPLE_COURSES = [
    "MATH1000",
    "MATH1010",
    "CHEM1011",
    "CHEM1012",
    "BIOL1010",
    "BIOL1011",
    "ECON1101",
    "ECON1102",
    "PSYO1021",
    "PSYO1022",
    "CSCI1105",
    "CSCI1110",
];
const SAMPLE_SIZE = 5;

/** A real week: one lecture section each of a few first-year courses at Dal, none clashing. */
async function sampleWeek() {
    const university = "dal";
    const [term, terms] = await Promise.all([getCurrentTerm(university), getTerms(university)]);
    const week: ClassSession[] = [];
    for (const code of SAMPLE_COURSES) {
        if (new Set(week.map((session) => session.course)).size >= SAMPLE_SIZE) break;
        const course = await getCourse(university, code);
        const lectures = course?.termClasses.filter((session) => session.term === term && session.type === "Lec") ?? [];
        for (const crn of new Set(lectures.map((session) => session.crn))) {
            const section = lectures.filter((session) => session.crn === crn);
            if (section.every((session) => findClashes(session, week).length === 0)) {
                week.push(...section);
                break;
            }
        }
    }

    const colors = courseColors([...new Set(week.map((session) => session.course))]);
    const events = week.flatMap((session) =>
        sessionEvents(session, () => ({
            title: formatCourseCode(session.course),
            // Timetable room names are long ("Mccain Arts&ss Bldg 2190"), so just who teaches it.
            lines: session.instructors?.slice(0, 1),
            variant: "tinted",
            color: colors[session.course],
            href: universityPath(university, `/${session.course}`),
            label: `${formatCourseCode(session.course)}, ${session.location}`,
        })),
    );
    return { events, termName: termLabel(terms, term) };
}

async function courseCounts(): Promise<Record<string, number>> {
    try {
        return await getCourseCounts();
    } catch (error) {
        console.error("Couldn't count courses for the landing page", error);
        return {};
    }
}

const questions = [
    {
        question: "Is there still room?",
        answer: "Every section shows its seats and waitlist, taken from your school's own timetable and updated each morning.",
    },
    {
        question: "Who's teaching, and are they any good?",
        answer: "Instructors are listed on each section with their RateMyProfessors score, and course pages pull out the reviews written about that course.",
    },
    {
        question: "Will it fit with my other classes?",
        answer: "Add a section and it goes on your week. Clashes are marked before you register, and Explore can hide anything that no longer fits.",
    },
    {
        question: "Where can I study right now?",
        answer: "Rooms lists the classrooms with nothing scheduled in them at the moment, and when that changes.",
    },
];

export default async function LandingPage() {
    const [counts, week] = await Promise.all([courseCounts(), sampleWeek().catch(() => null)]);
    const schools = [...universities].sort((a, b) => a.name.localeCompare(b.name));
    const link = "font-bold text-fg-muted transition-colors hover:text-fg";

    return (
        <div className="min-h-screen bg-canvas">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
            <header className="mx-auto flex max-w-[76rem] items-center justify-between px-5 py-5 sm:px-8">
                <span className="text-[19px] font-black tracking-tight">{SITE_NAME}</span>
                <ThemeToggle />
            </header>

            <main className="mx-auto max-w-[76rem] px-5 sm:px-8">
                <section className="grid gap-x-14 gap-y-12 pb-20 pt-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:pt-16">
                    <div>
                        <h1 className="text-balance text-[44px] font-black leading-[1.02] tracking-display sm:text-[56px]">
                            Plan your courses in one tab.
                        </h1>
                        <p className="mt-5 max-w-[34rem] text-[17px] leading-relaxed text-fg-body">
                            Picking courses usually means switching between your school&apos;s timetable,
                            RateMyProfessors and a week sketched in your notes. {SITE_NAME} puts them on one page, for{" "}
                            {universities.length} universities so far.
                        </p>

                        <h2 className="mt-10 text-[15px] font-bold text-fg-muted" id="schools">
                            Pick your school
                        </h2>
                        <ul className="-mx-3 mt-2" aria-labelledby="schools">
                            {schools.map((school) => (
                                <li key={school.id}>
                                    <Link
                                        href={universityPath(school.id, "/")}
                                        className="flex min-h-11 items-center gap-3 rounded-row px-3 py-2 transition-colors hover:bg-panel focus-visible:bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg"
                                    >
                                        <UniversityLogo university={school} />
                                        <span className="min-w-0 flex-1 text-[15px] font-bold leading-snug">
                                            {school.name}
                                        </span>
                                        {counts[school.id] > 0 && (
                                            <span className="shrink-0 text-[13px] text-fg-subtle">
                                                {formatNumber(counts[school.id])} courses
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {week && week.events.length > 0 && (
                        <figure className="min-w-0 self-start lg:sticky lg:top-8">
                            <div className="overflow-hidden rounded-panel border border-line bg-panel p-3 sm:p-4">
                                <WeekCalendar events={week.events} pxPerMinute={0.8} />
                            </div>
                            <figcaption className="mt-3 px-1 text-[13px] leading-relaxed text-fg-subtle">
                                A first-year week at Dalhousie, {week.termName}. These are real sections from this
                                term&apos;s timetable; click one to open the course.
                            </figcaption>
                        </figure>
                    )}
                </section>

                <section className="border-t border-line py-16" aria-label="What's on your school's page">
                    <dl className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
                        {questions.map(({ question, answer }) => (
                            <div key={question} className="max-w-md">
                                <dt className="text-[17px] font-bold">{question}</dt>
                                <dd className="mt-2 leading-relaxed text-fg-muted">{answer}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-12 max-w-xl leading-relaxed text-fg-muted">
                        You don&apos;t need an account to plan. Your schedule is saved in your browser. Signing in with
                        your school email lets you review courses you&apos;ve taken.
                    </p>
                </section>

                <section className="border-t border-line py-12">
                    <h2 className="text-[17px] font-bold">Don&apos;t see your school?</h2>
                    <p className="mt-2 max-w-xl leading-relaxed text-fg-muted">
                        Most schools publish their timetable in a way we can read. Tell us which one you go to and
                        we&apos;ll see if we can add it.{" "}
                        <a
                            href={`${links.source}/issues/new`}
                            className="font-bold text-fg underline underline-offset-4"
                        >
                            Request a school
                        </a>
                    </p>
                </section>
            </main>

            <footer className="mx-auto flex max-w-[76rem] flex-wrap gap-x-4 gap-y-2 border-t border-line px-5 py-6 text-[13px] text-fg-subtle sm:px-8">
                <span>
                    {SITE_NAME} isn&apos;t affiliated with any of these universities. Made by{" "}
                    <a href={links.theo} className={link}>
                        Théo Bourgeois
                    </a>{" "}
                    and{" "}
                    <a href={links.chris} className={link}>
                        Chris Langille
                    </a>
                    .
                </span>
                <span className="flex gap-4 sm:ml-auto">
                    <a href={links.source} className={link}>
                        Open source
                    </a>
                    <a href={links.coffee} className={link}>
                        Buy me a coffee
                    </a>
                </span>
            </footer>
        </div>
    );
}
