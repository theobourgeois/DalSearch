import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";
import { notFound } from "next/navigation";
import { accentCss } from "@/lib/accent";
import { AppShell } from "@/components/layout/app-shell";
import { UniversityProviders } from "@/components/providers";
import { getCourseIndex, getCurrentTerm, getTerms } from "@/lib/data";
import { DEFAULT_UNIVERSITY, getUniversity } from "@/lib/university";

type Props = { children: React.ReactNode; params: Promise<{ university: string }> };

/**
 * Only Dal's pages are built ahead: building every university's at once loads all their catalogs
 * together and the database starts refusing reads. The others render on their first visit and are
 * cached from then on. An id that isn't a university is a 404 (below).
 */
export function generateStaticParams() {
    return [{ university: DEFAULT_UNIVERSITY }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const university = getUniversity((await params).university);
    if (!university) return {};
    const title = `${SITE_NAME} - ${university.name} Course Search`;
    const description = `Search ${university.name} courses, see their sections, prerequisites and instructors, and plan your timetable.`;
    return {
        title,
        description,
        openGraph: { title, description },
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
