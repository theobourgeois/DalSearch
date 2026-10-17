import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { TERMLY_MARK_PATH } from "@/components/brand/termly-mark";
import { SITE_NAME } from "./constants";
import type { University } from "./university";

export const ogSize = { width: 1200, height: 630 };

const fonts = async () => {
    const font = (weight: 500 | 900) => readFile(join(process.cwd(), `src/app/fonts/og/Satoshi-${weight}.ttf`));
    const [regular, black] = await Promise.all([font(500), font(900)]);
    return [
        { name: "Satoshi", data: regular, weight: 500 as const, style: "normal" as const },
        { name: "Satoshi", data: black, weight: 900 as const, style: "normal" as const },
    ];
};

/** The university's logo as a data URI, since the image is drawn without a browser to fetch it. */
async function logoData(university: University): Promise<string> {
    const svg = await readFile(join(process.cwd(), "public", university.logo));
    return `data:image/svg+xml;base64,${svg.toString("base64")}`;
}

type Props = {
    /** The big line: a course code, a university's name, or the site's tagline. */
    title: string;
    /** A line under it. */
    subtitle?: string;
    university?: University;
};

/** The picture shown when a page is shared: plain text on the site's canvas, with the university's logo and colour. */
export async function ogImage({ title, subtitle, university }: Props) {
    const logo = university && (await logoData(university));
    return new ImageResponse(
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "72px 80px",
                background: "#F3F3F5",
                color: "#121214",
                fontFamily: "Satoshi",
                borderBottom: `16px solid ${university?.accent ?? "#121214"}`,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    fontSize: 30,
                    fontWeight: 500,
                    color: "#3A3A40",
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {logo && <img src={logo} width={52} height={52} style={{ objectFit: "contain" }} alt="" />}
                {university?.name}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div
                    style={{
                        fontSize: title.length > 24 ? 76 : 104,
                        fontWeight: 900,
                        letterSpacing: "-0.035em",
                        lineHeight: 1,
                    }}
                >
                    {title}
                </div>
                {subtitle && (
                    <div style={{ fontSize: 40, fontWeight: 500, color: "#3A3A40", lineHeight: 1.25 }}>{subtitle}</div>
                )}
            </div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontSize: 32,
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                }}
            >
                <svg viewBox="3 3 26 26" width={30} height={30} fill="#121214">
                    <path fillRule="evenodd" d={TERMLY_MARK_PATH} />
                </svg>
                {SITE_NAME}
            </div>
        </div>,
        { ...ogSize, fonts: await fonts() },
    );
}
