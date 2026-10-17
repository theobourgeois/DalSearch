import type { Metadata } from "next";
import { Landing } from "@/components/landing/landing";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { getLandingData } from "@/lib/landing";
import { universities } from "@/lib/university";

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

export default async function LandingPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
            <Landing {...await getLandingData()} />
        </>
    );
}
