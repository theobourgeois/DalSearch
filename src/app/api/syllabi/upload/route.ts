import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCourse } from "@/lib/data";
import { courseKey, formatCourseCode } from "@/lib/schedule";
import { adminClient } from "@/lib/supabase/admin";
import { extractSyllabus, normalizeCode, weightsAddUp } from "@/lib/syllabus-extraction";
import { getUniversity } from "@/lib/university";

/** The model can take a while on a long PDF. */
export const maxDuration = 60;

const BUCKET = "syllabus-uploads";
const MAX_UPLOADS_PER_DAY = 10;

/**
 * Checks a syllabus a student just put in storage ({ university, course, path, fileName }): the model
 * reads it, anything that isn't a syllabus for the course is turned away with a reason, and the rest
 * waits for a moderator. Rejected files are deleted.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in to share a syllabus." }, { status: 401 });

  const { university, course, path, fileName } = await request.json();
  const school = typeof university === "string" ? getUniversity(university) : undefined;
  const found = school && typeof course === "string" ? await getCourse(school.id, course) : undefined;
  if (!school || !found) return NextResponse.json({ error: "Unknown course." }, { status: 404 });
  if (typeof path !== "string" || !path.startsWith(`${session.user.id}/`) || !/\.pdf$/i.test(path)) {
    return NextResponse.json({ error: "Upload a PDF first." }, { status: 400 });
  }

  const code = courseKey(found);
  const admin = adminClient();
  const turnAway = async (error: string, status = 422) => {
    await admin.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error }, { status });
  };

  const { count } = await admin
    .from("syllabus_uploads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .gte("created_at", new Date(Date.now() - 86_400_000).toISOString());
  if ((count ?? 0) >= MAX_UPLOADS_PER_DAY) {
    return turnAway("You've shared a lot of syllabi today. Try again tomorrow.", 429);
  }

  const { data: file, error: downloadError } = await admin.storage.from(BUCKET).download(path);
  if (downloadError || !file) return NextResponse.json({ error: "Couldn't find the upload." }, { status: 400 });

  const name = typeof fileName === "string" && fileName.trim() ? fileName.trim().slice(0, 300) : "syllabus.pdf";
  let details;
  try {
    details = await extractSyllabus(await file.arrayBuffer(), name, school.name, formatCourseCode(code));
  } catch (error) {
    console.error("Syllabus extraction failed", error);
    return turnAway("We couldn't read that file. Try again, or share a different PDF.", 502);
  }

  if (!details.is_syllabus) return turnAway("That doesn't look like a course syllabus or outline.");
  // The same number under another subject is a cross-listing (BIOL 3003 and OCEA 3003).
  const named = details.course_codes.map(normalizeCode);
  if (named.length > 0 && !named.some((other) => other === code || other.endsWith(found.courseCode))) {
    return turnAway(
      `That looks like the syllabus for ${named.map(formatCourseCode).join(", ")}, not ${formatCourseCode(code)}.`,
    );
  }

  // Published already (scraped, or shared by someone else): same term and an instructor in common.
  if (details.term_year) {
    const { data: published } = await admin
      .from("syllabi")
      .select("term_season, instructors")
      .eq("university_id", school.id)
      .contains("course_codes", [code])
      .eq("term_year", details.term_year);
    const people = new Set(details.instructors.map((person) => person.toLowerCase()));
    const duplicate = (published ?? []).find(
      (syllabus) =>
        syllabus.term_season === details.term_season &&
        (people.size === 0 || syllabus.instructors.some((person: string) => people.has(person.toLowerCase()))),
    );
    if (duplicate) {
      const term = [details.term_season, details.term_year].filter(Boolean).join(" ");
      return turnAway(`We already have the ${term} syllabus for ${formatCourseCode(code)}. Thanks though!`, 409);
    }
  }

  const { data: upload, error } = await admin
    .from("syllabus_uploads")
    .insert({
      university_id: school.id,
      course_code: code,
      user_id: session.user.id,
      file_path: path,
      file_name: name,
      details,
    })
    .select("id")
    .single();
  if (error) {
    console.error("Couldn't save the upload", error);
    return turnAway("Couldn't save your syllabus. Try again.", 500);
  }

  return NextResponse.json({
    id: upload.id,
    term: [details.term_season, details.term_year].filter(Boolean).join(" ") || null,
    instructors: details.instructors,
    gradedOn: details.grading_schemes[0]?.components.map((component) => component.name) ?? [],
    weightsAddUp: weightsAddUp(details),
  });
}
