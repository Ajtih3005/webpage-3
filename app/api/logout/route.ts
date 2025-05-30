import { type NextRequest, NextResponse } from "next/server"
import { invalidateToken } from "@/lib/auth-tokens"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    console.log("🔐 Logout request received", { token: token ? "provided" : "missing" })

    // Invalidate token in database if provided
    if (token) {
      const success = await invalidateToken(token)
      if (!success) {
        console.log("⚠️ Failed to invalidate token in database")
      }
    }

    // Create response with cookie clearing
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    // 🚨 CRITICAL: CLEAR ALL AUTH COOKIES
    const cookiesToClear = [
      "userId",
      "user_id",
      "userToken",
      "user_token",
      "authToken",
      "auth_token",
      "sessionId",
      "session_id",
      "loginToken",
      "login_token",
    ]

    // Clear each possible auth cookie
    for (const cookieName of cookiesToClear) {
      console.log(`🍪 Clearing cookie: ${cookieName}`)
      response.cookies.delete(cookieName)
    }

    console.log("✅ Logout successful - all cookies cleared")
    return response
  } catch (error) {
    console.error("❌ Error logging out:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Server error during logout",
      },
      { status: 500 },
    )
  }
}
