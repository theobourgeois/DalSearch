import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";
import { notFound } from "next/navigation";
import { CourseActions } from "@/components/course/course-actions";
import { CourseProvider } from "@/components/course/course-context";
import { CourseDetails } from "@/components/course/course-details";
import { CourseSyllabus } from "@/components/course/course-syllabus";
import { CourseTabs } from "@/components/course/course-tabs";
import { CourseWeek } from "@/components/course/course-week";
import { RecordRecentCourse } from "@/components/course/record-recent-course";
import { ReviewsSummary } from "@/components/course/reviews-summary";
import { SectionsTable } from "@/components/course/sections-table";
import { Page, PageHeader } from "@/components/layout/page";
import { CourseReviews } from "@/components/reviews/course-reviews";
import { ReviewsProvider } from "@/components/reviews/reviews-context";
import { RmpReviews } from "@/components/reviews/rmp-reviews";
import { getRmpReviews, getSyllabi } from "@/lib/course-content";
import { defaultCourseTerm, offeredTerms } from "@/lib/course";
import {
    getCourse,
    getCourseInstructors,
    getCurrentTerm,
    getListedTerms,
    getRatingSummaries,
    getSubjects,
    getUnlockedCourses,
    toListItem,
} from "@/lib/data";
import { courseKey, formatCourseCode } from "@/lib/schedule";
import { getUniversity, universityPath } from "@/lib/university";

type Props = { params: Promise<{ university: string; course: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { university, course: code } = await params;
    const course = await getCourse(university, code);
    const name = getUniversity(university)?.name ?? "";
    if (!course) return { title: `Course not found - ${SITE_NAME}` };

    return {
        title: `${formatCourseCode(courseKey(course))} - ${course.title} - ${name}`,
        description: course.description,
        keywords: [course.subjectCode, course.courseCode, course.title, ...course.prerequisites, name, SITE_NAME],
    };
}

export default async function CoursePage({ params }: Props) {
    const { university, course: requested } = await params;
    const course = await getCourse(university, requested);
    if (!course) notFound();

    const code = courseKey(course);
    const instructors = getCourseInstructors(course);
    const [rmpReviews, syllabi, listed, currentTerm, subjects, unlocks, ratings] = await Promise.all([
        getRmpReviews(university, code),
        getSyllabi(university, code),
        getListedTerms(university),
        getCurrentTerm(university),
        getSubjects(university),
        getUnlockedCourses(university, code),
        getRatingSummaries(university, instructors),
    ]);
    const offered = offeredTerms(course, listed);
    const subject = subjects.find((s) => s.code === course.subjectCode);
    const description = course.description;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Course",
        name: `${formatCourseCode(code)} ${course.title}`,
        description,
        provider: { "@type": "Organization", name: SITE_NAME, url: "https://dalsearch.com" },
    };

    return (
        <Page
            breadcrumbs={[
                { label: "Explore", href: universityPath(university, "/explore") },
                ...(subject
                    ? [{ label: subject.name, href: universityPath(university, `/explore?subject=${subject.code}`) }]
                    : []),
                { label: formatCourseCode(code) },
            ]}
        >
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
            <RecordRecentCourse code={code} />

            <CourseProvider
                course={toListItem(course)}
                offered={offered}
                initialTerm={defaultCourseTerm(offered, currentTerm, listed)}
            >
                <ReviewsProvider courseId={code} instructors={instructors} rmpReviews={rmpReviews}>
                    <PageHeader title={formatCourseCode(code)} subtitle={course.title} />
                    <CourseActions title={`${formatCourseCode(code)} ${course.title}`} />
                    <CourseTabs
                        overview={
                            <>
                                {description && (
                                    <p className="max-w-[42rem] text-[15.5px] font-medium leading-relaxed text-fg-body">
                                        {description}
                                    </p>
                                )}
                                <SectionsTable />
                                <CourseSyllabus syllabi={syllabi} />
                                <ReviewsSummary />
                            </>
                        }
                        schedule={<CourseWeek />}
                        reviews={
                            <>
                                <CourseReviews />
                                <RmpReviews />
                            </>
                        }
                        aside={
                            <CourseDetails
                                prerequisites={course.prerequisites}
                                unlocks={unlocks.map((summary) => summary.code)}
                                ratings={ratings}
                            />
                        }
                    />
                </ReviewsProvider>
            </CourseProvider>
        </Page>
    );
}
