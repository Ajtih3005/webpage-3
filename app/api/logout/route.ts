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
      clearScript: `
        // Clear all cookies
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          document.cookie = \`\${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;\`;
        });
        
        // Clear localStorage
        localStorage.clear();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        console.log('All browser storage cleared');
      `,
    })

    // 🚨 CLEAR ALL POSSIBLE AUTH COOKIES
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
      "userAuthenticated",
      "userName",
      "userEmail",
      "userPhone",
    ]

    // Clear each possible auth cookie
    for (const cookieName of cookiesToClear) {
      console.log(`🍪 Clearing cookie: ${cookieName}`)
      // Set to empty, expired, and path=/
      response.cookies.set({
        name: cookieName,
        value: "",
        expires: new Date(0),
        path: "/",
      })
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
