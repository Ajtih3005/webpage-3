import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Temporarily disable all middleware redirects to debug the issue
  return NextResponse.next()

  /* Original code commented out
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/" || path === "/user/login" || path === "/user/register" || path === "/admin/login"

  // Get authentication status from cookies
  const isUserAuthenticated = request.cookies.has("userId")
  const isAdminAuthenticated = request.cookies.has("adminAuthenticated")

  // User routes protection
  if (path.startsWith("/user") && !isPublicPath && !isUserAuthenticated) {
    return NextResponse.redirect(new URL("/user/login", request.url))
  }

  // Admin routes protection
  if (path.startsWith("/admin") && !isPublicPath && !isAdminAuthenticated) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  // Redirect authenticated users away from login/register pages
  if (isPublicPath && path !== "/" && isUserAuthenticated) {
    return NextResponse.redirect(new URL("/user/dashboard", request.url))
  }

  return NextResponse.next()
  */
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
}
