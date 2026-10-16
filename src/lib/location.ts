const campuses = ["Studley", "Carleton", "Sexton", "Truro", "Agricultural"];

/** Words that stay uppercase when a building name is title-cased. */
const acronyms = new Set(["LSC", "MACME", "SUB", "CHEB", "IDEA", "CS", "II", "III"]);

export type RoomLocation = {
    campus: string | null;
    building: string;
    room: string;
    /** "Goldberg Computer Science Bldg 127" */
    name: string;
};

function titleCase(text: string): string {
    return text
        .toLowerCase()
        .split(/\s+/)
        .map((word) =>
            acronyms.has(word.toUpperCase()) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1),
        )
        .join(" ");
}

/** Splits a timetable location such as "Studley GOLDBERG COMPUTER SCIENCE BLDG 127" into its parts. */
export function parseLocation(location: string): RoomLocation {
    const words = (typeof location === "string" ? location : "").trim().split(/\s+/).filter(Boolean);
    const campus = campuses.includes(words[0]) ? words.shift()! : null;
    const room = words.length > 1 ? words.pop()! : "";
    const building = titleCase(words.join(" "));
    return { campus, building, room, name: [building, room].filter(Boolean).join(" ") };
}

export function formatLocation(location: string): string {
    return parseLocation(location).name || location;
}
