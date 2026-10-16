import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/** Colour tokens are defined as RGB channels in globals.css so opacity modifiers work. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
    darkMode: ["class"],
    content: ["./src/**/*.{ts,tsx,mdx}"],
    theme: {
        extend: {
            colors: {
                canvas: token("canvas"),
                panel: token("panel"),
                raised: token("raised"),
                block: token("block"),
                fg: {
                    DEFAULT: token("fg"),
                    body: token("fg-body"),
                    muted: token("fg-muted"),
                    subtle: token("fg-subtle"),
                },
                line: {
                    DEFAULT: "var(--line)",
                    strong: "var(--line-strong)",
                },
                accent: {
                    DEFAULT: token("accent"),
                    fg: token("accent-fg"),
                },
                success: token("success"),
                danger: token("danger"),
            },
            fontFamily: {
                sans: ["var(--font-satoshi)", "ui-sans-serif", "system-ui", "sans-serif"],
            },
            borderRadius: {
                panel: "1.625rem",
                card: "1.5rem",
                row: "1.25rem",
                block: "0.75rem",
            },
            letterSpacing: {
                display: "-0.035em",
            },
        },
    },
    plugins: [animate],
} satisfies Config;
