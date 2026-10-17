import { SITE_NAME } from "@/lib/constants";
import { ogImage, ogSize } from "@/lib/og-image";
import { universities } from "@/lib/university";

export const alt = `${SITE_NAME}: course search and timetable planning`;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
    return ogImage({
        title: "Plan your courses in one tab.",
        subtitle: `Course search and timetables for ${universities.length} Canadian universities.`,
    });
}
