import type { Metadata } from "next";
import "./globals.css";
import { Poppins } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { courses } from "@/lib/course-utils";
import Header from "../components/header";
import { Toaster } from "@/components/ui/sonner";
import FloatingSchedule from "@/components/floating-schedule";
import UserSchedule from "@/components/user-schedule";
import Footer from "@/components/footer";

const poppins = Poppins({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-poppins",
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const keywords = [
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
];

export const metadata: Metadata = {
    title: "DalSearch - Dalhousie University Course Search Tool",
    description:
        "Easily search and discover classes offered at Dalhousie University. Find course details, schedules, and more with our comprehensive search tool.",
    keywords,

    authors: [
        { name: "Théo Bourgeois" },
        { name: "Chris Langille" },
        { name: "Dalhousie University" },
    ],

    generator: "Next.js",

    applicationName: "Dalhousie University Course Search Tool",

    referrer: "origin-when-cross-origin",

    openGraph: {
        type: "website",
        locale: "en_CA",
        url: "https://dalsearch.com",
        title: "DalSearch - Dalhousie University Course Search Tool",
        description:
            "Easily search and discover classes offered at Dalhousie University. Find course details, schedules, and more with our comprehensive search tool.",
        siteName: "DalSearch",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "DalSearch - Dalhousie University Course Search Tool",
            },
        ],
    },

    // Icons
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon-16x16.png",
        apple: "/apple-touch-icon.png",
        other: [
            {
                rel: "icon",
                type: "image/png",
                sizes: "32x32",
                url: "/favicon-32x32.png",
            },
        ],
    },

    // Robots directives
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

    // Verification for search console
    verification: {
        google: process.env.GOOGLE_VERIFICATION, // Add your Google verification code
        //yandex: "yandex-verification",
        //yahoo: "yahoo-verification",
    },

    // Alternate languages/versions if you have them
    alternates: {
        canonical: "https://dalsearch.com",
        languages: {
            "en-US": "https://dalsearch.com/en-US",
            "fr-CA": "https://dalsearch.com/fr-CA",
        },
    },

    // Additional metadata
    category: "technology",

    // For apps/PWA
    manifest: "/manifest.json",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body
                    className={`${poppins.variable} antialiased bg-gradient-to-t from-gray-200 to-gray-50/50 dark:from-gray-900 dark:to-gray-900 dark:text-white`}
                >
                    <Header courses={courses} />
                    {children}
                    <Footer />

                    <Toaster closeButton richColors />
                    <FloatingSchedule>
                        <UserSchedule />
                    </FloatingSchedule>
                </body>
            </html>
        </ClerkProvider>
    );
}
