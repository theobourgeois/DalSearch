import type { Metadata } from "next";
import "./globals.css";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { courses } from "@/utils/course";
import Header from "../components/header";
import { Toaster } from "@/components/ui/sonner";
import FloatingSchedule from "@/components/floating-schedule";
import UserSchedule from "@/components/user-schedule";

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
        <html lang="en">
            <body
                className={`${poppins.variable} antialiased bg-gradient-to-t from-gray-200 to-gray-50/50 dark:from-gray-900 dark:to-gray-900 dark:text-white`}
            >
                <Header courses={courses} />
                {children}
                <footer className="bg-gradient-to-r from-gray-800 to-black text-white py-8 px-4">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-xl font-semibold mb-4">
                                Quick Links
                            </h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link
                                        href="https://www.dal.ca/"
                                        className="hover:text-yellow-400 transition-colors"
                                    >
                                        About Dalhousie
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="https://self-service.dal.ca/BannerExtensibility/customPage/page/dal.stuweb_academicTimetable"
                                        className="hover:text-yellow-400 transition-colors"
                                    >
                                        Dal Academic Timetable
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="https://github.com/theobourgeois/DalSearch"
                                        className="hover:text-yellow-400 transition-colors"
                                    >
                                        Source Code
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-4">
                                Created By
                            </h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link
                                        href="https://theobourgeois.com"
                                        className="hover:text-yellow-400 transition-colors"
                                    >
                                        Théo Bourgeois
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="https://chrislangille.github.io/portfolio"
                                        className="hover:text-yellow-400 transition-colors"
                                    >
                                        Chris Langille
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-sm">
                        <p>
                            DalSearch is not Affiliate with Dalhousie
                            University.
                        </p>
                    </div>
                </footer>{" "}
                <Toaster closeButton richColors />
                <FloatingSchedule>
                    <UserSchedule />
                </FloatingSchedule>
            </body>
        </html>
    );
}
