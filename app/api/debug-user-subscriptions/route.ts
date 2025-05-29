import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()

    // Get user ID from query params or cookies
    const url = new URL(request.url)
    const userIdParam = url.searchParams.get("userId")
    const userIdCookie = request.cookies.get("userId")?.value

    const userId = userIdParam || userIdCookie

    if (!userId) {
      return NextResponse.json({ error: "No user ID provided" }, { status: 400 })
    }

    console.log("🔍 Debugging subscriptions for user:", userId)

    // Get all user subscriptions with full details
    const { data: userSubs, error: subError } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        subscription:subscriptions (
          id,
          name,
          description,
          price,
          duration_days,
          is_active
        )
      `)
      .eq("user_id", userId)

    console.log("📊 User subscriptions result:", userSubs)
    console.log("📊 Error:", subError)

    // Also check if user exists
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    console.log("👤 User data:", user)
    console.log("👤 User error:", userError)

    // Get all available subscriptions
    const { data: allSubscriptions } = await supabase.from("subscriptions").select("*")

    return NextResponse.json({
      success: true,
      userId,
      user,
      userError,
      subscriptions: userSubs,
      subscriptionError: subError,
      allAvailableSubscriptions: allSubscriptions,
      debug: {
        userIdType: typeof userId,
        userIdParsed: Number.parseInt(userId),
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ Debug API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
