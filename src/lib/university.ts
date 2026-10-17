/**
 * The universities the site covers. Each matches a row in the universities table and has a scraper
 * in src/scripts/node/universities/. Listed here too because routing needs the ids before any data loads.
 */
export type University = {
    id: string;
    name: string;
    /** "Dal", "MSVU" */
    shortName: string;
    /** The timezone its timetable is in. */
    timezone: string;
    /** What it calls the credit a course is worth. */
    creditLabel: string;
    /** The university's own timetable, for "open in the timetable" links. */
    timetableUrl: string;
    /** Shown in email fields: "NetID@dal.ca". */
    emailExample: string;
};

export const universities: University[] = [
    {
        id: "dal",
        name: "Dalhousie University",
        shortName: "Dal",
        timezone: "America/Halifax",
        creditLabel: "Credit hours",
        timetableUrl: "https://self-service.dal.ca/BannerExtensibility/customPage/page/dal.stuweb_academicTimetable",
        emailExample: "NetID@dal.ca",
    },
    {
        id: "msvu",
        name: "Mount Saint Vincent University",
        shortName: "MSVU",
        timezone: "America/Halifax",
        creditLabel: "Units",
        timetableUrl: "https://colssprod.msvu.ca/student/courses/",
        emailExample: "name@msvu.ca",
    },
];

/** Dal was the only university for years, so its pages keep their addresses at the root of the site. */
export const DEFAULT_UNIVERSITY = "dal";

export function getUniversity(id: string): University | undefined {
    return universities.find((university) => university.id === id);
}

/** Where a page lives: "/explore" at Dal, "/msvu/explore" elsewhere. */
export function universityPath(id: string, path: string): string {
    const page = path.startsWith("/") ? path : `/${path}`;
    if (id === DEFAULT_UNIVERSITY) return page;
    return page === "/" ? `/${id}` : `/${id}${page}`;
}

/** The university an API request asks for with ?university=, Dal when it doesn't say, or null if unknown. */
export function requestedUniversity(request: Request): string | null {
    const id = new URL(request.url).searchParams.get("university") ?? DEFAULT_UNIVERSITY;
    return getUniversity(id) ? id : null;
}

/** The university a path belongs to and the path within it: "/msvu/explore" -> msvu, "/explore". */
export function splitUniversityPath(pathname: string): { university: string; path: string } {
    const [, first = "", ...rest] = pathname.split("/");
    if (first !== DEFAULT_UNIVERSITY && getUniversity(first)) {
        return { university: first, path: `/${rest.join("/")}` };
    }
    return { university: DEFAULT_UNIVERSITY, path: pathname || "/" };
}
