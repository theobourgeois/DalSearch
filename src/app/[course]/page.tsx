import type { Metadata } from "next";
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
import { defaultCourseTerm, offeredTerms, plainText, subjectName } from "@/lib/course";
import {
    getCourse,
    getCourseInstructors,
    getCurrentTerm,
    getRatingSummary,
    getUnlockedCourses,
    subjects,
    toListItem,
} from "@/lib/data";
import { courseKey, formatCourseCode } from "@/lib/schedule";

type Props = { params: Promise<{ course: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const course = getCourse((await params).course);
    if (!course) return { title: "Course not found - DalSearch" };

    return {
        title: `${formatCourseCode(courseKey(course))} - ${course.title} - Dalhousie University`,
        description: plainText(course.description),
        keywords: [
            course.subjectCode,
            course.courseCode,
            course.title,
            ...course.prerequisites,
            "Dalhousie University",
            "dalsearch",
            "Halifax",
        ],
    };
}

export default async function CoursePage({ params }: Props) {
    const course = getCourse((await params).course);
    if (!course) notFound();

    const code = courseKey(course);
    const [rmpReviews, syllabi] = await Promise.all([getRmpReviews(code), getSyllabi(code)]);
    const offered = offeredTerms(course);
    const instructors = getCourseInstructors(course);
    const subject = subjects.find((s) => s.code === course.subjectCode);
    const description = plainText(course.description);

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Course",
        name: `${formatCourseCode(code)} ${course.title}`,
        description,
        provider: { "@type": "Organization", name: "DalSearch", url: "https://dalsearch.com" },
    };

    return (
        <Page
            breadcrumbs={[
                { label: "Explore", href: "/explore" },
                ...(subject ? [{ label: subjectName(subject), href: `/explore?subject=${subject.code}` }] : []),
                { label: formatCourseCode(code) },
            ]}
        >
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
            <RecordRecentCourse code={code} />

            <CourseProvider
                course={toListItem(course)}
                offered={offered}
                initialTerm={defaultCourseTerm(offered, getCurrentTerm())}
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
                                unlocks={getUnlockedCourses(code).map((summary) => summary.code)}
                                ratings={Object.fromEntries(instructors.map((name) => [name, getRatingSummary(name)]))}
                            />
                        }
                    />
                </ReviewsProvider>
            </CourseProvider>
        </Page>
    );
}
