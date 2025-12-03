import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse, type NextRequest } from "next/server"

const isProtectedRoute = createRouteMatcher([
  "/protected(.*)",
  "/reviews(.*)",
  "/panel(.*)",
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims } = await auth()
  
  // Check if email is verified for protected routes
  if (isProtectedRoute(req)) {
    if (!userId) {
      const url = req.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Clerk automatically handles email verification, but we can check if needed
    // If email is not verified, Clerk will handle it, but we can add custom logic here
    const emailVerified = sessionClaims?.email_verified as boolean | undefined
    
    if (emailVerified === false) {
      const url = req.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("error", "Please verify your email address before accessing this page.")
      return NextResponse.redirect(url)
    }
  }
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
