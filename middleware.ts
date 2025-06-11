import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionActive = request.cookies.get("session_active")?.value === "true"

  // Protected routes that require authentication
  const protectedRoutes = [
    "/user/dashboard",
    "/user/access-course",
    "/user/profile",
    "/user/subscriptions",
    "/user/documents",
    "/user/notifications",
    "/user/plans",
    "/user/subscribe",
    "/user/payment-success",
    "/user/invoices",
    "/user/reviews",
    "/user/previous-sessions",
    "/user/view-session",
    "/user/video-player",
    "/user/course-content",
    "/user/subscription-categories",
    "/admin",
    "/instructor",
  ]

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // If it's a protected route and user is not authenticated
  if (isProtectedRoute && !sessionActive) {
    // Redirect to login page
    const loginUrl = new URL("/user/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated and trying to access login/register pages
  if (sessionActive && (pathname === "/user/login" || pathname === "/user/register")) {
    return NextResponse.redirect(new URL("/user/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
