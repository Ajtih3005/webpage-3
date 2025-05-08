import { type NextRequest, NextResponse } from "next/server"
import { invalidateToken } from "@/lib/auth-tokens"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, message: "Token is required" }, { status: 400 })
    }

    // Invalidate the token
    const success = await invalidateToken(token)

    if (!success) {
      return NextResponse.json({ success: false, message: "Failed to invalidate token" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Logged out successfully" })
  } catch (error) {
    console.error("Error logging out:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
