import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    console.log("🔍 Starting link validation for token:", params.token)

    const token = params.token
    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

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
    const userIdNum = Number.parseInt(userId)

    console.log("🔍 Checking authorization for user:", userIdNum, "Link type:", link.target_type)

    if (link.target_type === "all") {
      // All logged-in users can access
      console.log("✅ Link is for all users - access granted")
      isAllowed = true
    } else if (link.target_type === "user" || link.target_type === "users") {
      // Specific user(s) - check if current user is in target_ids
      const targetIds = link.target_ids

      console.log("🔍 Checking user access. Target IDs:", targetIds, "User ID:", userIdNum)

      // Handle JSONB array from database
      if (Array.isArray(targetIds)) {
        // Already an array
        const targetIdNumbers = targetIds.map((id) => Number.parseInt(id.toString()))
        isAllowed = targetIdNumbers.includes(userIdNum)
        console.log("🔍 User access check (array):", {
          targetIds: targetIdNumbers,
          userIdNum,
          isAllowed,
        })
      } else {
        console.log("❌ Invalid target_ids format for user targeting:", targetIds)
        isAllowed = false
      }
    } else if (link.target_type === "subscription") {
      // Users with specific subscriptions - check active subscriptions
      const targetSubscriptionIds = link.target_ids

      console.log("🔍 Checking subscription access...")
      console.log("Target subscription IDs:", targetSubscriptionIds)
      console.log("User ID for subscription check:", userIdNum)

      if (Array.isArray(targetSubscriptionIds)) {
        const targetSubIds = targetSubscriptionIds.map((id) => Number.parseInt(id.toString()))
        console.log("🔍 Checking subscription access for IDs:", targetSubIds)

        // First, let's check ALL user subscriptions (not just active ones)
        const { data: allUserSubs, error: allSubsError } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", userIdNum)

        console.log("📊 All user subscriptions:", allUserSubs)
        console.log("📊 All subs error:", allSubsError)

        // Now check active subscriptions with detailed logging
        const { data: userSubscriptions, error: subError } = await supabase
          .from("user_subscriptions")
          .select("subscription_id, is_active, activation_date, total_active_days_used")
          .eq("user_id", userIdNum)

        console.log("📊 User subscriptions query result:", userSubscriptions)
        console.log("📊 Subscription query error:", subError)

        if (subError) {
          console.error("❌ Error fetching user subscriptions:", subError)
          isAllowed = false
        } else if (userSubscriptions && userSubscriptions.length > 0) {
          console.log("📊 Found user subscriptions:", userSubscriptions.length)

          // Check each subscription
          for (const sub of userSubscriptions) {
            console.log("🔍 Checking subscription:", {
              subscription_id: sub.subscription_id,
              is_active: sub.is_active,
              activation_date: sub.activation_date,
              total_active_days_used: sub.total_active_days_used,
            })
          }

          // Get active subscriptions
          const activeSubscriptions = userSubscriptions.filter(
            (sub) => sub.is_active === true && sub.activation_date !== null,
          )

          console.log("📊 Active subscriptions:", activeSubscriptions)

          if (activeSubscriptions.length > 0) {
            const userSubIds = activeSubscriptions.map((sub) => sub.subscription_id)
            console.log("User active subscription IDs:", userSubIds)

            // Check if user has any of the target subscriptions
            isAllowed = targetSubIds.some((targetId) => userSubIds.includes(targetId))
            console.log("Subscription access check result:", {
              targetSubIds,
              userSubIds,
              isAllowed,
            })
          } else {
            console.log("❌ User has no active subscriptions")
            isAllowed = false
          }
        } else {
          console.log("❌ User has no subscriptions at all")
          isAllowed = false
        }
      } else {
        console.log("❌ Invalid target_ids format for subscription targeting:", targetSubscriptionIds)
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
          error: "You are not authorized to use this link. Please check your subscription status or contact support.",
          debug: {
            target_type: link.target_type,
            target_ids: link.target_ids,
            user_id: userId,
            user_id_num: userIdNum,
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
