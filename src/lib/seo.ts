import type { Metadata } from "next";
import { universityPath } from "./university";

/** Title, description and canonical address for one of a university's pages. */
export function universityPageMetadata(
    university: string,
    path: string,
    { title, description }: { title: string; description: string },
): Metadata {
    const url = universityPath(university, path);
    return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } };
}

/** Text cut to fit a search result's description: whole words, about 155 characters. */
export function snippet(text: string, max = 155): string {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max - 1);
    return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.]$/, "")}…`;
}

/** For pages behind a sign-in, which shouldn't show up in search. */
export const privatePage: Metadata = { robots: { index: false, follow: false } };
