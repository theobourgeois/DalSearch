import { ogImage, ogSize } from "@/lib/og-image";
import { getUniversity } from "@/lib/university";

export const alt = "Course search and timetable planning";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ university: string }> }) {
    const university = getUniversity((await params).university)!;
    return ogImage({
        title: "Find a course",
        subtitle: "Open seats, instructors and their ratings, and a week that shows clashes.",
        university,
    });
}
