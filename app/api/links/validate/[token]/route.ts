import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = getSupabaseServerClient()
    const { token } = params

    console.log("🔍 Validating token:", token)

    // Get user ID from cookies
    const userId = request.cookies.get("userId")?.value
    console.log("👤 User ID:", userId)

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

    // Get the link
    const { data: link, error: linkError } = await supabase
      .from("generated_links")
      .select("*")
      .eq("token", token)
      .eq("is_active", true)
      .single()

    if (linkError || !link) {
      console.error("❌ Link not found:", linkError)
      return NextResponse.json(
        {
          success: false,
          error: "Link not found or inactive",
        },
        { status: 404 },
      )
    }

    console.log("✅ Link found:", link)

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "Link has expired",
        },
        { status: 403 },
      )
    }

    // Check authorization
    const userIdNum = Number.parseInt(userId)
    let isAuthorized = false

    console.log("🔍 Checking authorization for user:", userIdNum, "Target type:", link.target_type)

    switch (link.target_type) {
      case "all":
        isAuthorized = true
        console.log("✅ All users allowed")
        break

      case "user":
        if (link.target_ids) {
          const allowedUserIds = link.target_ids.split(",").map((id) => Number.parseInt(id.trim()))
          isAuthorized = allowedUserIds.includes(userIdNum)
          console.log("🔍 User check:", { allowedUserIds, userIdNum, isAuthorized })
        }
        break

      case "users":
        if (link.target_ids) {
          const allowedUserIds = link.target_ids.split(",").map((id) => Number.parseInt(id.trim()))
          isAuthorized = allowedUserIds.includes(userIdNum)
          console.log("🔍 Users check:", { allowedUserIds, userIdNum, isAuthorized })
        }
        break

      case "subscription":
        if (link.target_ids) {
          const allowedSubIds = link.target_ids.split(",").map((id) => Number.parseInt(id.trim()))
          console.log("🔍 Checking subscriptions:", allowedSubIds)

          // Check if user has any of these subscriptions
          const { data: userSubs, error: subError } = await supabase
            .from("user_subscriptions")
            .select("subscription_id")
            .eq("user_id", userIdNum)

          if (!subError && userSubs) {
            const userSubIds = userSubs.map((sub) => sub.subscription_id)
            isAuthorized = allowedSubIds.some((subId) => userSubIds.includes(subId))
            console.log("🔍 Subscription check:", { allowedSubIds, userSubIds, isAuthorized })
          }
        }
        break

      default:
        console.log("❌ Unknown target type:", link.target_type)
        isAuthorized = false
    }

    if (!isAuthorized) {
      console.log("❌ User not authorized")
      return NextResponse.json(
        {
          success: false,
          error: "You are not authorized to use this link. Please check your subscription status or contact support.",
        },
        { status: 403 },
      )
    }

    console.log("✅ User authorized")
    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        title: link.title,
        description: link.description,
        target_url: link.target_url,
        link_type: link.link_type,
      },
    })
  } catch (error) {
    console.error("❌ Validation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
