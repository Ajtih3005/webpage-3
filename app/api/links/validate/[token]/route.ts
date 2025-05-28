import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token
    const supabase = createClient()

    // Get the current user ID from the request cookies (if logged in)
    const userId = request.cookies.get("userId")?.value

    // Fetch the link
    const { data: link, error } = await supabase
      .from("generated_links")
      .select("*")
      .eq("token", token)
      .eq("is_active", true)
      .single()

    if (error || !link) {
      return NextResponse.json({ success: false, error: "Link not found or inactive" }, { status: 404 })
    }

    // Check if the link has expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: "Link has expired" }, { status: 403 })
    }

    // ALWAYS require login for ALL links
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Login required",
          requiresLogin: true,
          loginUrl: `/user/login?redirect=/l/${token}`,
        },
        { status: 401 },
      )
    }

    // Check if the user is allowed to use this link
    let isAllowed = false

    if (link.target_type === "all") {
      // "All Users" = All LOGGED-IN users (already checked login above)
      isAllowed = true
    } else if (link.target_type === "user" && link.target_ids && link.target_ids.includes(Number.parseInt(userId))) {
      // Specific user - must be logged in as that user
      isAllowed = true
    } else if (link.target_type === "users") {
      // Multiple users - must be logged in (already checked above)
      // AND must be in the target_ids list
      isAllowed = link.target_ids && link.target_ids.includes(Number.parseInt(userId))
    } else if (link.target_type === "subscription") {
      // Check if the user has the specified subscription
      const { data: userSubscriptions, error: subError } = await supabase
        .from("user_subscriptions")
        .select("subscription_id")
        .eq("user_id", userId)

      if (!subError && userSubscriptions) {
        const userSubIds = userSubscriptions.map((sub) => sub.subscription_id)
        isAllowed = link.target_ids.some((id: number) => userSubIds.includes(id))
      }
    }

    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "You are not authorized to use this link" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        title: link.title,
        description: link.description,
        target_url: link.target_url,
        link_type: link.link_type,
      },
      userInfo: { loggedIn: true, userId },
    })
  } catch (error) {
    console.error("Error in links/validate route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
