import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
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

const description =
    "Search courses at Canadian universities, see open seats and who's teaching, and plan a timetable that doesn't clash.";

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: { default: `${SITE_NAME} - Course search and timetable planning`, template: `%s | ${SITE_NAME}` },
    description,
    authors: [{ name: "Théo Bourgeois" }, { name: "Chris Langille" }],
    applicationName: SITE_NAME,
    referrer: "origin-when-cross-origin",
    openGraph: { type: "website", locale: "en_CA", siteName: SITE_NAME },
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
    category: "technology",
    manifest: "/manifest.json",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en-CA" className={satoshi.variable} suppressHydrationWarning>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
