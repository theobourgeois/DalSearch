import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** ["a", "b", "c"] -> "a, b and c". */
export function joinWords(words: string[]): string {
    return words.length <= 1 ? (words[0] ?? "") : `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;
}

const numberFormat = new Intl.NumberFormat("en-CA");

/** 4689 -> "4,689", with a fixed locale so server and client render the same text. */
export function formatNumber(value: number): string {
    return numberFormat.format(value);
}

/** "1 class", "3 classes". */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
    return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}
