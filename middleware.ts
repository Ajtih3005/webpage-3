import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Don't auto-set any cookies
  const response = NextResponse.next()

  // If there's no explicit login, don't set userId
  const userId = request.cookies.get("userId")?.value

  // Log for debugging
  if (userId) {
    console.log("🔍 Middleware found userId:", userId)
  }

  return response
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
