import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    console.log("🔍 Starting link validation for token:", params.token)

    const token = params.token
    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 400 })
    }

    const supabase = createClient()

    // Get the current user ID from the request cookies (if logged in)
    const userId = request.cookies.get("userId")?.value
    console.log("👤 User ID from cookies:", userId || "Not logged in")

    // Fetch the link
    const { data: link, error } = await supabase
      .from("generated_links")
      .select("*")
      .eq("token", token)
      .eq("is_active", true)
      .single()

    if (error || !link) {
      console.error("❌ Link not found:", error)
      return NextResponse.json({ success: false, error: "Link not found or inactive" }, { status: 404 })
    }

    console.log("✅ Link found:", {
      id: link.id,
      title: link.title,
      target_type: link.target_type,
      target_ids: link.target_ids,
    })

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
      // All logged-in users can access
      console.log("✅ Link is for all users - access granted")
      isAllowed = true
    } else if (link.target_type === "user") {
      // Specific single user
      let targetIds = link.target_ids
      if (typeof targetIds === "string") {
        try {
          targetIds = JSON.parse(targetIds)
        } catch (e) {
          targetIds = [targetIds] // Handle single ID as string
        }
      }
      if (!Array.isArray(targetIds)) {
        targetIds = [targetIds]
      }

      const userIdNum = Number.parseInt(userId)
      isAllowed = targetIds.includes(userIdNum)
      console.log("🔍 Single user check:", { targetIds, userIdNum, isAllowed })
    } else if (link.target_type === "users") {
      // Multiple specific users
      let targetIds = link.target_ids
      if (typeof targetIds === "string") {
        try {
          targetIds = JSON.parse(targetIds)
        } catch (e) {
          targetIds = [targetIds]
        }
      }
      if (!Array.isArray(targetIds)) {
        targetIds = [targetIds]
      }

      const userIdNum = Number.parseInt(userId)
      isAllowed = targetIds.includes(userIdNum)
      console.log("🔍 Multiple users check:", { targetIds, userIdNum, isAllowed })
    } else if (link.target_type === "subscription") {
      // Users with specific subscriptions
      let targetIds = link.target_ids
      if (typeof targetIds === "string") {
        try {
          targetIds = JSON.parse(targetIds)
        } catch (e) {
          targetIds = [targetIds]
        }
      }
      if (!Array.isArray(targetIds)) {
        targetIds = [targetIds]
      }

      console.log("🔍 Checking subscription access for IDs:", targetIds)

      // Check if the user has any of the specified subscriptions
      const { data: userSubscriptions, error: subError } = await supabase
        .from("user_subscriptions")
        .select("subscription_id, is_active")
        .eq("user_id", userId)

      if (subError) {
        console.error("❌ Error fetching user subscriptions:", subError)
        isAllowed = false
      } else if (userSubscriptions && userSubscriptions.length > 0) {
        const userSubIds = userSubscriptions
          .filter((sub) => sub.is_active) // Only active subscriptions
          .map((sub) => sub.subscription_id)

        console.log("User active subscription IDs:", userSubIds)
        isAllowed = targetIds.some((id: number) => userSubIds.includes(id))
        console.log("Subscription access allowed:", isAllowed)
      } else {
        console.log("❌ User has no active subscriptions")
        isAllowed = false
      }
    } else {
      console.log("❌ Unknown target_type:", link.target_type)
      isAllowed = false
    }

    if (!isAllowed) {
      console.log("❌ User not authorized for this link")
      return NextResponse.json(
        {
          success: false,
          error: "You are not authorized to use this link",
          debug: {
            target_type: link.target_type,
            target_ids: link.target_ids,
            user_id: userId,
          },
        },
        { status: 403 },
      )
    }

    console.log("✅ User authorized, returning success")
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
    console.error("❌ Unexpected error in links/validate route:", error)
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
