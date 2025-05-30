import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    console.log("🔐 Logout request for userId:", userId)

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    // Clear the specific cookies we found
    const cookiesToClear = ["userId", "visitor", "userToken", "authToken", "sessionId"]

    cookiesToClear.forEach((cookieName) => {
      // Clear for current domain
      response.cookies.set({
        name: cookieName,
        value: "",
        expires: new Date(0),
        path: "/",
      })
      // Clear for subdomain
      response.cookies.set({
        name: cookieName,
        value: "",
        expires: new Date(0),
        path: "/",
        domain: ".sthavishtah.com",
      })
    })

    console.log("✅ Logout API - cookies cleared")
    return response
  } catch (error) {
    console.error("❌ Logout API error:", error)
    return NextResponse.json({ success: false, message: "Logout failed" }, { status: 500 })
  }
}
