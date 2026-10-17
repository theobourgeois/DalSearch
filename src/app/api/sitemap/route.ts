import { getCourses } from "@/lib/data";
import { universities, universityPath } from "@/lib/university";

const STATIC_PAGES = ["/", "/explore", "/schedule", "/rooms", "/instructors"];

const entry = (path: string, changefreq: string, priority: number) => `
        <url>
          <loc>https://www.dalsearch.com${path}</loc>
          <changefreq>${changefreq}</changefreq>
          <priority>${priority}</priority>
        </url>
      `;

export async function GET() {
  const pages = await Promise.all(
    universities.map(async ({ id }) => [
      ...STATIC_PAGES.map((page) => entry(universityPath(id, page), "weekly", 0.8)),
      ...(await getCourses(id)).map((course) =>
        entry(universityPath(id, `/${course.subjectCode + course.courseCode}`), "monthly", 0.6),
      ),
    ]),
  );
  const urls = pages.flat();

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls.join("")}
    </urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
