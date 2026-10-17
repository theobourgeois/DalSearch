import { getCourses } from "@/lib/data";
import type { Course } from "@/lib/types";
import Fuse from "fuse.js";
import { requestedUniversity } from "@/lib/university";

// Per university, rebuilt when its catalog reloads (getCourses returns a new list then).
const indexes = new Map<string, { courses: Course[]; fuse: Fuse<Course> }>();
async function getFuse(university: string) {
  const courses = await getCourses(university);
  let index = indexes.get(university);
  if (index?.courses !== courses) {
    index = { courses, fuse: new Fuse(courses, { includeScore: true, keys: ['courseCode', 'subjectCode', 'title'] }) };
    indexes.set(university, index);
  }
  return index.fuse;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const searchTerm = params.get('searchTerm');
  const limit = params.get('limit')
  const offset = params.get('offset')

  if (searchTerm === null) {
    return new Response('Search term not provided', { status: 404 });
  }

  const university = requestedUniversity(request);
  if (!university) {
    return new Response('Unknown university', { status: 404 });
  }

  let results = (await getFuse(university)).search(searchTerm);
  if (limit) {
    const o = parseInt(offset ?? "0", 10);
    const l = parseInt(limit, 10);
    results = results.slice(o, o + l);
  }

  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Allow requests from any origin
      'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow GET and OPTIONS methods
      'Access-Control-Allow-Headers': 'Content-Type', // Allow specific headers
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
