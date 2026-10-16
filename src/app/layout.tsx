import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/providers";
import { getCourseIndex, getCurrentTerm } from "@/lib/data";
import "./globals.css";

const satoshi = localFont({
    src: [
        { path: "./fonts/Satoshi-400.woff2", weight: "400" },
        { path: "./fonts/Satoshi-500.woff2", weight: "500" },
        { path: "./fonts/Satoshi-700.woff2", weight: "700" },
        { path: "./fonts/Satoshi-900.woff2", weight: "900" },
    ],
    variable: "--font-satoshi",
    display: "swap",
});

/** Re-render static pages daily so the current term and live room data stay fresh. */
export const revalidate = 86400;

const title = "DalSearch - Dalhousie University Course Search Tool";
const description =
    "Easily search and discover classes offered at Dalhousie University. Find course details, schedules, and more with our comprehensive search tool.";

export const metadata: Metadata = {
    title,
    description,
    keywords: [
        "dalhousie",
        "university",
        "course",
        "search",
        "schedule",
        "catalog",
        "classes",
        "academic",
        "timetable",
        "dalhousie university timetable",
        "dal search",
        "dalhousie university",
        "course search",
        "dalsearch",
        "dal",
        "halifax",
    ],
    authors: [{ name: "Théo Bourgeois" }, { name: "Chris Langille" }],
    applicationName: "Dalhousie University Course Search Tool",
    referrer: "origin-when-cross-origin",
    openGraph: {
        type: "website",
        locale: "en_CA",
        url: "https://dalsearch.com",
        title,
        description,
        siteName: "DalSearch",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: title }],
    },
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon-16x16.png",
        apple: "/apple-touch-icon.png",
        other: [{ rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon-32x32.png" }],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    verification: { google: process.env.GOOGLE_VERIFICATION },
    alternates: {
        canonical: "https://dalsearch.com",
        languages: { "en-US": "https://dalsearch.com/en-US", "fr-CA": "https://dalsearch.com/fr-CA" },
    },
    category: "technology",
    manifest: "/manifest.json",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <ClerkProvider>
            <html lang="en" className={satoshi.variable} suppressHydrationWarning>
                <body>
                    <Providers courseIndex={getCourseIndex()} currentTerm={getCurrentTerm()}>
                        <AppShell>{children}</AppShell>
                    </Providers>
                </body>
            </html>
        </ClerkProvider>
    );
}
