import { getCourse } from "@/lib/data";

export async function GET(_request: Request, { params }: { params: Promise<{ course: string }> }) {
  const course = getCourse((await params).course);

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
