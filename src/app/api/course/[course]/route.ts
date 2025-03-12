import { courses } from "@/lib/course-utils";
import { CourseAndSubjectCode } from "@/lib/types";

export async function GET(request: Request) {
  const code = request.url.split('/').pop()?.toUpperCase();
  const course = code ? courses[code as CourseAndSubjectCode] : null;

  if (!course) {
    return new Response('Course not found', { status: 404 });
  }

  return new Response(JSON.stringify(course), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
