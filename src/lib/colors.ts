import type { CourseAndSubjectCode } from "./types";

/** Course colours, chosen to read on both the light and dark themes. */
const palette = ["#5C8FF0", "#9D80EC", "#3FBF8C", "#EF7B5C", "#E2A32E", "#E06AA8", "#2EB3B1", "#7C86F2"];

/** Gives every course a stable colour based on the order it appears in the schedule. */
export function courseColors(codes: CourseAndSubjectCode[]): Record<string, string> {
    return Object.fromEntries(codes.map((code, index) => [code, palette[index % palette.length]]));
}

function withAlpha(hex: string, alpha: number): string {
    const value = Number.parseInt(hex.slice(1), 16);
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

/**
 * A soft, opaque tint of a course colour on the panel background in either theme. Built from plain rgba
 * layers (not color-mix) so schedule image exports can render it.
 */
export function tintStyle(color: string, strength = 0.2): React.CSSProperties {
    const layer = withAlpha(color, strength);
    return { backgroundColor: "rgb(var(--panel))", backgroundImage: `linear-gradient(${layer}, ${layer})` };
}
