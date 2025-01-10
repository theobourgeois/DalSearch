import {
  defaultFilter,
  defaultOrderBy,
  getFilteredCourses,
} from "@/utils/course";
import { CourseFilter, CourseOrderBy, courses } from "@/utils/course";

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

const courseList = Object.values(courses);

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


  const results = getFilteredCourses(courseList, filter, orderBy, limit);

  return new Response(JSON.stringify(results), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
