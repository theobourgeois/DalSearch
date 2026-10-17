"use client";

import { useTerms } from "@/components/current-term";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTermSchedule, type TermSchedule } from "@/hooks/use-term-schedule";
import { type Term } from "@/lib/constants";
import { termSessions } from "@/lib/course";
import { courseKey, findClashes, formatCourseCode, getCourseFit, groupByType } from "@/lib/schedule";
import type { ClassSession, CourseAndSubjectCode, CourseListItem, SessionType } from "@/lib/types";
import { useScheduleStore } from "@/store/schedule-store";

export type CourseTab = "overview" | "schedule" | "reviews";

/** The chosen section (CRN) for each session type. */
type Selection = Partial<Record<SessionType, string>>;

type CourseContextValue = {
    code: CourseAndSubjectCode;
    course: CourseListItem;
    offered: Term[];
    term: Term;
    setTerm: (term: Term) => void;
    tab: CourseTab;
    setTab: (tab: CourseTab) => void;
    groups: [SessionType, ClassSession[]][];
    selected: ClassSession[];
    isSelected: (session: ClassSession) => boolean;
    /** Picks `session` as the section for its type. */
    select: (session: ClassSession) => void;
    /** The student's other courses in this term. */
    otherSessions: ClassSession[];
    clashesFor: (session: ClassSession) => ClassSession[];
    inSchedule: boolean;
    /** True when the student picked sections that differ from what's in the schedule. */
    changed: boolean;
    saveToSchedule: () => void;
    removeFromSchedule: () => void;
    schedule: TermSchedule;
};

const CourseContext = createContext<CourseContextValue | null>(null);

const toSelection = (sessions: ClassSession[]): Selection =>
    Object.fromEntries(sessions.map((session) => [session.type, session.crn]));

type CourseProviderProps = {
    course: CourseListItem;
    offered: Term[];
    initialTerm: Term;
    children: React.ReactNode;
};

/**
 * State for one course page: the term being viewed, the section picked for each type, and adding the
 * course to the schedule. Until the student picks something, the selection defaults to what's already
 * scheduled, or to the first sections that fit around their other courses.
 */
export function CourseProvider({ course, offered, initialTerm, children }: CourseProviderProps) {
    const { label: termLabel } = useTerms();
    const router = useRouter();
    const code = courseKey(course);
    const [term, setTerm] = useState(initialTerm);
    const [tab, setTab] = useState<CourseTab>("overview");
    const [choices, setChoices] = useState<Partial<Record<Term, Selection>>>({});
    const schedule = useTermSchedule(term);
    const setCourseSessions = useScheduleStore((state) => state.setCourseSessions);
    const removeCourse = useScheduleStore((state) => state.removeCourse);

    useEffect(() => {
        if (window.location.hash === "#reviews") setTab("reviews");
    }, []);

    const value = useMemo<CourseContextValue>(() => {
        const sessions = termSessions(course, term);
        const groups = groupByType(sessions);
        const own = schedule.sessions.filter((session) => session.course === code);
        const otherSessions = schedule.sessions.filter((session) => session.course !== code);

        const fit = getCourseFit(course, term, otherSessions);
        const defaults =
            own.length > 0 ? own : fit.status === "fits" ? fit.picks : groups.map(([, options]) => options[0]);
        const choice = choices[term];
        const selection = choice ?? toSelection(defaults);
        const selected = sessions.filter((session) => selection[session.type] === session.crn);
        const ownCrns = new Set(own.map((session) => session.crn));
        const changed =
            !!choice &&
            own.length > 0 &&
            (own.length !== selected.length || selected.some((session) => !ownCrns.has(session.crn)));

        const resetChoice = () => setChoices((current) => ({ ...current, [term]: undefined }));
        const viewSchedule = { label: "View schedule", onClick: () => router.push("/schedule") };

        return {
            code,
            course,
            offered,
            term,
            setTerm,
            tab,
            setTab,
            groups,
            selected,
            isSelected: (session) => selection[session.type] === session.crn,
            select: (session) =>
                setChoices((current) => ({ ...current, [term]: { ...selection, [session.type]: session.crn } })),
            otherSessions,
            clashesFor: (session) => findClashes(session, otherSessions),
            inSchedule: own.length > 0,
            changed,
            saveToSchedule: () => {
                setCourseSessions(code, term, selected);
                resetChoice();
                toast(`${own.length > 0 ? "Updated" : "Added"} ${formatCourseCode(code)} in ${termLabel(term)}`, {
                    action: viewSchedule,
                });
            },
            removeFromSchedule: () => {
                removeCourse(code, term);
                resetChoice();
                toast(`Removed ${formatCourseCode(code)} from ${termLabel(term)}`, {
                    action: { label: "Undo", onClick: () => setCourseSessions(code, term, own) },
                });
            },
            schedule,
        };
    }, [choices, code, course, offered, removeCourse, router, schedule, setCourseSessions, tab, term, termLabel]);

    return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourse(): CourseContextValue {
    const context = useContext(CourseContext);
    if (!context) throw new Error("useCourse must be used inside CourseProvider");
    return context;
}
