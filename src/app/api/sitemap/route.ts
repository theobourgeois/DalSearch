import { courses } from "@/lib/course-utils";

const STATIC_PAGES = ["/", "/explore", "/schedule"];

export async function GET() {
  const urls = [
    ...STATIC_PAGES.map(
      (page) => `
        <url>
          <loc>https://www.dalsearch.com${page}</loc>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `
    ),
    ...Object.values(courses).map(
      (course) => `
        <url>
          <loc>https://www.dalsearch.com/${course.subjectCode + course.courseCode}</loc>
          <changefreq>monthly</changefreq>
          <priority>0.6</priority>
        </url>
      `
    ),
  ];

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
