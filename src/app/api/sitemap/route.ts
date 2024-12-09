import { courses } from "@/utils/course";

export async function GET() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${Object.values(courses)
      .map(
        (course) => `
        <url>
          <loc>https://dalsearch.com/${course.subjectCode + course.courseCode}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
        </url>
      `
      )
      .join('')}
    </urlset>`;
  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
