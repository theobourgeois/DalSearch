import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";
import { notFound } from "next/navigation";
import { accentCss } from "@/lib/accent";
import { AppShell } from "@/components/layout/app-shell";
import { UniversityProviders } from "@/components/providers";
import { getCourseIndex, getCurrentTerm, getTerms } from "@/lib/data";
import { DEFAULT_UNIVERSITY, getUniversity, universities, universityPath } from "@/lib/university";

type Props = { children: React.ReactNode; params: Promise<{ university: string }> };

/** Every university's pages are built ahead; an id that isn't a university is a 404. */
export function generateStaticParams() {
    return universities.map(({ id }) => ({ university: id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const university = getUniversity((await params).university);
    if (!university || university.id === DEFAULT_UNIVERSITY) return {};
    const title = `${SITE_NAME} - ${university.name} Course Search`;
    const description = `Search ${university.name} courses, see their sections, prerequisites and instructors, and plan your timetable.`;
    return {
        title,
        description,
        openGraph: { title, description, url: `https://dalsearch.com${universityPath(university.id, "/")}` },
        alternates: { canonical: `https://dalsearch.com${universityPath(university.id, "/")}` },
    };
}

export default async function UniversityLayout({ children, params }: Props) {
    const { university } = await params;
    const info = getUniversity(university);
    if (!info) notFound();
    const [courseIndex, terms, currentTerm] = await Promise.all([
        getCourseIndex(university),
        getTerms(university),
        getCurrentTerm(university),
    ]);

    return (
        <>
            {/* Not in a wrapper's style, so menus and dialogs rendered outside the page get the accent too. */}
            <style dangerouslySetInnerHTML={{ __html: accentCss(info.accent) }} />
            <UniversityProviders
                university={university}
                courseIndex={courseIndex}
                terms={terms}
                currentTerm={currentTerm}
            >
                <AppShell>{children}</AppShell>
            </UniversityProviders>
        </>
    );
}
