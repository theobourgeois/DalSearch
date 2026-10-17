import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"
import { DEFAULT_UNIVERSITY, getUniversity } from "@/lib/university"

/**
 * The landing page is at /, and every university's pages are under its id: /dal/explore, /msvu/CSCI2110.
 * Dal's pages used to be at the root of the site, so any other address redirects to Dal's page for it.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const [, first = ""] = pathname.split("/")

  // API routes, files (/manifest.json, /robots.txt) and the landing page's social image aren't pages.
  const isPage = !["api", "opengraph-image"].includes(first) && !/\.[a-z0-9]+$/i.test(pathname)
  if (!isPage || pathname === "/" || getUniversity(first)) return updateSession(request)

  const url = request.nextUrl.clone()
  url.pathname = `/${DEFAULT_UNIVERSITY}${pathname}`
  return NextResponse.redirect(url, 308)
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
