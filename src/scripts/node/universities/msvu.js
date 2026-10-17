/**
 * Mount Saint Vincent University: Colleague Self-Service's public course catalog (see ../lib/colleague.js).
 */
import { colleague } from "../lib/colleague.js";

export const { scrapeTimetable, scrapeCourseDetails } = colleague({ baseUrl: "https://colssprod.msvu.ca/student" });
