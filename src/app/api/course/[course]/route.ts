import { CourseAndSubjectCode, courses } from "@/utils/course";

export async function GET(request: Request) {
  const code = request.url.split('/').pop()?.toUpperCase();
  const course = code ? courses[code as CourseAndSubjectCode] : null;

  if (!course) {
    return new Response('Course not found', { status: 404 });
  }

  return new Response(JSON.stringify(course), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
