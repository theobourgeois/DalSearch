import { getCourses, getListedTerms } from "@/lib/data";
import { defaultFilter, defaultOrderBy, getFilteredCourses } from "@/lib/filter";
import { CourseFilter, CourseOrderBy } from "@/lib/types";
import { requestedUniversity } from "@/lib/university";

type Payload = {
  filter: CourseFilter;
  orderBy: CourseOrderBy;
};

const PAYLOAD_LIMIT = 50;

function applyDefaults(payload: Payload): Payload {
  const filter = { ...defaultFilter, ...payload.filter };
  const orderBy = { ...defaultOrderBy, ...payload.orderBy };

  return { filter, orderBy };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const filterParams = params.get("filter");
  const orderByParams = params.get("orderBy");
  const limit = params.get("limit")
    ? parseInt(params.get("limit") as string, 10)
    : 100;

  const payload = {
    filter: JSON.parse(filterParams as string) ?? {},
    orderBy: JSON.parse(orderByParams as string) ?? {},
  }

  const { filter, orderBy } = applyDefaults(payload);

  if (
    Object.keys(filter).length > PAYLOAD_LIMIT ||
    Object.keys(orderBy).length > PAYLOAD_LIMIT
  ) {
    return new Response("Payload too large", { status: 413 });
  }


  const university = requestedUniversity(request);
  if (!university) return new Response("Unknown university", { status: 404 });
  const [courses, listed] = await Promise.all([getCourses(university), getListedTerms(university)]);
  const results = getFilteredCourses(courses, filter, orderBy, limit, listed);

  return new Response(JSON.stringify(results), {
    headers: {
      "Content-Type": "application/json",
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
