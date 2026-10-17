import { TermlyLogo } from "@/components/brand/termly-mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { sessionEvents, type CalendarEvent } from "@/lib/calendar";
import { courseColors } from "@/lib/colors";
import { links, SITE_NAME } from "@/lib/constants";
import type { SampleWeek } from "@/lib/landing";
import { formatCourseCode } from "@/lib/schedule";
import { universities, universityPath } from "@/lib/university";
import { cn } from "@/lib/utils";

export const schools = [...universities].sort((a, b) => a.name.localeCompare(b.name));

export function LandingHeader({ className }: { className?: string }) {
    return (
        <header className={cn("mx-auto flex max-w-[76rem] items-center justify-between px-5 py-5 sm:px-8", className)}>
            <TermlyLogo />
            <ThemeToggle />
        </header>
    );
}

export const intro = (
    <>
        Picking courses usually means switching between your school&apos;s timetable, RateMyProfessors and a week
        sketched in your notes. {SITE_NAME} puts them on one page, for {universities.length} universities so far.
    </>
);

/** The sample week as calendar events, each class showing who teaches it. */
export function weekEvents(week: SampleWeek): CalendarEvent[] {
    const colors = courseColors(week.classes.map((sample) => sample.code));
    return week.classes.flatMap((sample) =>
        sample.sessions.flatMap((session) =>
            sessionEvents(session, () => ({
                title: formatCourseCode(sample.code),
                lines: sample.instructor ? [sample.instructor] : [],
                variant: "tinted",
                color: colors[sample.code],
                href: universityPath(week.university, `/${sample.code}`),
                label: `${formatCourseCode(sample.code)} ${sample.title}`,
            })),
        ),
    );
}

export const questions = [
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

export function Questions({ className }: { className?: string }) {
    return (
        <dl className={cn("grid gap-x-12 gap-y-10 sm:grid-cols-2", className)}>
            {questions.map(({ question, answer }) => (
                <div key={question} className="max-w-md">
                    <dt className="text-[17px] font-bold">{question}</dt>
                    <dd className="mt-2 leading-relaxed text-fg-muted">{answer}</dd>
                </div>
            ))}
        </dl>
    );
}

export function AccountNote({ className }: { className?: string }) {
    return (
        <p className={cn("max-w-xl leading-relaxed text-fg-muted", className)}>
            You don&apos;t need an account to plan: your schedule is saved in your browser. Sign in with your school
            email to keep it on every device and to review courses you&apos;ve taken.
        </p>
    );
}

export function RequestSchool({ className }: { className?: string }) {
    return (
        <section id="request" className={cn("scroll-mt-8", className)}>
            <h2 className="text-[17px] font-bold">Don&apos;t see your school?</h2>
            <p className="mt-2 max-w-xl leading-relaxed text-fg-muted">
                Most schools publish their timetable in a way we can read. Tell us which one you go to and we&apos;ll
                see if we can add it.{" "}
                <a href={`${links.source}/issues/new`} className="font-bold text-fg underline underline-offset-4">
                    Request a school
                </a>
            </p>
        </section>
    );
}

export function LandingFooter() {
    const link = "font-bold text-fg-muted transition-colors hover:text-fg";
    return (
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
    );
}
