import type { ClassSession, ScheduleBufferMinutes, Time } from "./types";

export const SCHEDULE_BUFFER_MINUTES: ScheduleBufferMinutes[] = [
  0, 5, 10, 15, 30,
];

function timeToMinutes(time: Exclude<Time, "C/D">): number {
  const hour = Number.parseInt(time.slice(0, 2), 10);
  const minute = Number.parseInt(time.slice(2, 4), 10);
  return hour * 60 + minute;
}

function hasScheduledTime(termClass: ClassSession): boolean {
  return termClass.time.start !== "C/D" && termClass.time.end !== "C/D";
}

function isClassSession(value: unknown): value is ClassSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ClassSession>;

  return (
    typeof candidate.crn === "string" &&
    typeof candidate.term === "string" &&
    Array.isArray(candidate.days) &&
    !!candidate.time &&
    typeof candidate.time.start === "string" &&
    typeof candidate.time.end === "string"
  );
}

type ScheduledClassSession = ClassSession & {
  time: {
    start: Exclude<Time, "C/D">;
    end: Exclude<Time, "C/D">;
  };
};

function toScheduledClassSession(
  termClass: ClassSession,
): ScheduledClassSession | null {
  if (!hasScheduledTime(termClass)) {
    return null;
  }

  return termClass as ScheduledClassSession;
}

export function classSessionsConflict(
  firstClass: ClassSession,
  secondClass: ClassSession,
  bufferMinutes = 0,
): boolean {
  if (!isClassSession(firstClass) || !isClassSession(secondClass)) {
    return false;
  }

  if (firstClass.crn === secondClass.crn) {
    return false;
  }

  if (firstClass.term !== secondClass.term) {
    return false;
  }

  const normalizedFirstClass = toScheduledClassSession(firstClass);
  const normalizedSecondClass = toScheduledClassSession(secondClass);

  if (!normalizedFirstClass || !normalizedSecondClass) {
    return false;
  }

  const shareDay = normalizedFirstClass.days.some((day) =>
    normalizedSecondClass.days.includes(day),
  );

  if (!shareDay) {
    return false;
  }

  const firstStart = timeToMinutes(normalizedFirstClass.time.start);
  const firstEnd = timeToMinutes(normalizedFirstClass.time.end);
  const secondStart = timeToMinutes(normalizedSecondClass.time.start);
  const secondEnd = timeToMinutes(normalizedSecondClass.time.end);

  return (
    firstStart < secondEnd + bufferMinutes &&
    firstEnd > secondStart - bufferMinutes
  );
}

export function classSessionFitsSchedule(
  candidateClass: ClassSession,
  scheduledClasses: ClassSession[],
  bufferMinutes = 0,
): boolean {
  if (!isClassSession(candidateClass)) {
    return false;
  }

  return !scheduledClasses.some(
    (scheduledClass) =>
      isClassSession(scheduledClass) &&
      classSessionsConflict(candidateClass, scheduledClass, bufferMinutes),
  );
}
