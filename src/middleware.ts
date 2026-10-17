import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"
import { DEFAULT_UNIVERSITY, getUniversity } from "@/lib/university"

/**
 * Every page lives under app/[university]. Dal's pages keep their addresses at the root of the site, so
 * a path that doesn't start with another university's id is served from /dal, and /dal/... redirects to
 * the shorter address.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const [, first = ""] = pathname.split("/")

  if (first === DEFAULT_UNIVERSITY) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(DEFAULT_UNIVERSITY.length + 1) || "/"
    return NextResponse.redirect(url, 308)
  }

  // API routes and files (/manifest.json, /robots.txt) aren't pages.
  const isPage = first !== "api" && !/\.[a-z0-9]+$/i.test(pathname)
  if (!isPage || getUniversity(first)) return updateSession(request)

  const url = request.nextUrl.clone()
  url.pathname = `/${DEFAULT_UNIVERSITY}${pathname === "/" ? "" : pathname}`
  return updateSession(request, url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
