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
    /** Its primary brand colour, the accent on its pages (see accent.ts). */
    accent: string;
    /** Its crest or symbol, under public/universities. */
    logo: string;
    /** A version of the logo for the dark theme, when the usual one is too dark to see. */
    logoDark?: string;
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
        accent: "#FFD400",
        logo: "/universities/dal.svg",
        logoDark: "/universities/dal-dark.svg",
    },
    {
        id: "msvu",
        name: "Mount Saint Vincent University",
        shortName: "MSVU",
        timezone: "America/Halifax",
        creditLabel: "Units",
        timetableUrl: "https://colssprod.msvu.ca/student/courses/",
        emailExample: "name@msvu.ca",
        accent: "#00529B",
        logo: "/universities/msvu.svg",
    },
    {
        id: "smu",
        name: "Saint Mary's University",
        shortName: "SMU",
        timezone: "America/Halifax",
        creditLabel: "Credit hours",
        timetableUrl: "https://reg-prod.ec.smu.ca/StudentRegistrationSsb/ssb/term/termSelection?mode=search",
        emailExample: "name@smu.ca",
        accent: "#612141",
        logo: "/universities/smu.svg",
        logoDark: "/universities/smu-dark.svg",
    },
    {
        id: "mun",
        name: "Memorial University of Newfoundland",
        shortName: "MUN",
        timezone: "America/St_Johns",
        creditLabel: "Credit hours",
        timetableUrl: "https://self-service.mun.ca/StudentRegistrationSsb/ssb/term/termSelection?mode=search",
        emailExample: "name@mun.ca",
        accent: "#862633",
        logo: "/universities/mun.svg",
    },
    {
        id: "uvic",
        name: "University of Victoria",
        shortName: "UVic",
        timezone: "America/Vancouver",
        creditLabel: "Units",
        timetableUrl: "https://banner.uvic.ca/StudentRegistrationSsb/ssb/term/termSelection?mode=search",
        emailExample: "name@uvic.ca",
        accent: "#005493",
        logo: "/universities/uvic.svg",
        logoDark: "/universities/uvic-dark.svg",
    },
    {
        id: "usask",
        name: "University of Saskatchewan",
        shortName: "USask",
        timezone: "America/Regina",
        creditLabel: "Credit units",
        timetableUrl: "https://banner.usask.ca/StudentRegistrationSsb/ssb/term/termSelection?mode=search",
        emailExample: "abc123@usask.ca",
        accent: "#0B6A41",
        logo: "/universities/usask.svg",
    },
    {
        id: "kpu",
        name: "Kwantlen Polytechnic University",
        shortName: "KPU",
        timezone: "America/Vancouver",
        creditLabel: "Credits",
        timetableUrl: "https://reg-prod.ec.kpu.ca/StudentRegistrationSsb/ssb/term/termSelection?mode=search",
        emailExample: "name@student.kpu.ca",
        accent: "#8C2332",
        logo: "/universities/kpu.svg",
        logoDark: "/universities/kpu-dark.svg",
    },
    {
        id: "tru",
        name: "Thompson Rivers University",
        shortName: "TRU",
        timezone: "America/Vancouver",
        creditLabel: "Credits",
        timetableUrl: "https://reg-prod.ec.tru.ca/StudentRegistrationSsb/ssb/term/termSelection?mode=search",
        emailExample: "T00123456@mytru.ca",
        accent: "#003E51",
        logo: "/universities/tru.svg",
        logoDark: "/universities/tru-dark.svg",
    },
    {
        id: "unbc",
        name: "University of Northern British Columbia",
        shortName: "UNBC",
        timezone: "America/Vancouver",
        creditLabel: "Credit hours",
        timetableUrl: "https://selfservice.unbc.ca/StudentRegistrationSsb/ssb/term/termSelection?mode=search",
        emailExample: "name@unbc.ca",
        accent: "#035642",
        logo: "/universities/unbc.svg",
        logoDark: "/universities/unbc-dark.svg",
    },
    {
        id: "yukonu",
        name: "Yukon University",
        shortName: "YukonU",
        timezone: "America/Whitehorse",
        creditLabel: "Credits",
        timetableUrl: "https://banner.yukonu.ca/StudentRegistrationSsb/ssb/term/termSelection?mode=search",
        emailExample: "name@yukonu.ca",
        accent: "#503B80",
        logo: "/universities/yukonu.svg",
        logoDark: "/universities/yukonu-dark.svg",
    },
    {
        id: "stfx",
        name: "St. Francis Xavier University",
        shortName: "StFX",
        timezone: "America/Halifax",
        creditLabel: "Credits",
        timetableUrl: "https://bannerss.stfx.ca/StudentRegistrationSsb/ssb/term/termSelection?mode=search",
        emailExample: "x2026abc@stfx.ca",
        // StFX Blue (#001B40) is nearly black, so its lighter secondary blue.
        accent: "#425F8E",
        logo: "/universities/stfx.svg",
    },
    {
        id: "upei",
        name: "University of Prince Edward Island",
        shortName: "UPEI",
        timezone: "America/Halifax",
        creditLabel: "Credits",
        timetableUrl: "https://selfservice.upei.ca/Student/Courses",
        emailExample: "name@upei.ca",
        accent: "#8C2004",
        logo: "/universities/upei.svg",
    },
    {
        id: "laurentian",
        name: "Laurentian University",
        shortName: "Laurentian",
        timezone: "America/Toronto",
        creditLabel: "Credits",
        timetableUrl: "https://selfservice.laurentian.ca/Student/Courses",
        emailExample: "name@laurentian.ca",
        accent: "#003E7E",
        logo: "/universities/laurentian.svg",
    },
];

/**
 * Dal was the only university for years, when its pages lived at the root of the site. Old addresses
 * (/explore, /CSCI2110) redirect to its pages, and its browser storage keeps the old keys.
 */
export const DEFAULT_UNIVERSITY = "dal";

export function getUniversity(id: string): University | undefined {
    return universities.find((university) => university.id === id);
}

/** Where a university's page lives: "/explore" -> "/msvu/explore". */
export function universityPath(id: string, path: string): string {
    const page = path.startsWith("/") ? path : `/${path}`;
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
    if (getUniversity(first)) {
        return { university: first, path: `/${rest.join("/")}` };
    }
    return { university: DEFAULT_UNIVERSITY, path: pathname || "/" };
}
