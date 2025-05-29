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
      console.log("🔍 Target IDs type:", typeof targetIds, "Is array:", Array.isArray(targetIds))

      if (Array.isArray(targetIds) && targetIds.length > 0) {
        // Convert target IDs to numbers for comparison
        const targetIdNumbers = targetIds
          .map((id) => {
            const numId = typeof id === "string" ? Number.parseInt(id) : Number(id)
            console.log("🔍 Converting ID:", id, "->", numId)
            return numId
          })
          .filter((id) => !isNaN(id)) // Remove any NaN values

        console.log("🔍 Final target ID numbers:", targetIdNumbers)
        console.log("🔍 User ID to match:", userIdNum)

        isAllowed = targetIdNumbers.includes(userIdNum)
        console.log("🔍 User access check result:", isAllowed)
      } else if (targetIds && !Array.isArray(targetIds)) {
        // Handle single ID case
        const singleId = typeof targetIds === "string" ? Number.parseInt(targetIds) : Number(targetIds)
        console.log("🔍 Single ID check:", singleId, "vs", userIdNum)
        isAllowed = singleId === userIdNum
      } else {
        console.log("❌ Invalid or empty target_ids for user targeting:", targetIds)
        isAllowed = false
      }
    } else if (link.target_type === "subscription") {
      // Users with specific subscriptions - check user_subscriptions table
      const targetSubscriptionIds = link.target_ids

      console.log("🔍 Checking subscription access...")
      console.log("🔍 Target subscription IDs:", targetSubscriptionIds, "Type:", typeof targetSubscriptionIds)
      console.log("🔍 User ID for subscription check:", userIdNum)

      if (Array.isArray(targetSubscriptionIds) && targetSubscriptionIds.length > 0) {
        // Convert target subscription IDs to numbers
        const targetSubIds = targetSubscriptionIds
          .map((id) => {
            const numId = typeof id === "string" ? Number.parseInt(id) : Number(id)
            console.log("🔍 Converting subscription ID:", id, "->", numId)
            return numId
          })
          .filter((id) => !isNaN(id))

        console.log("🔍 Final target subscription IDs:", targetSubIds)

        // Query user_subscriptions table directly
        const { data: userSubscriptions, error: subError } = await supabase
          .from("user_subscriptions")
          .select("subscription_id, is_active, activation_date, status")
          .eq("user_id", userIdNum)

        console.log("📊 Raw user subscriptions from DB:", userSubscriptions)
        console.log("📊 Subscription query error:", subError)

        if (subError) {
          console.error("❌ Error fetching user subscriptions:", subError)
          isAllowed = false
        } else if (userSubscriptions && userSubscriptions.length > 0) {
          // Get ALL subscription IDs that the user has
          const userSubIds = userSubscriptions.map((sub) => Number(sub.subscription_id)).filter((id) => !isNaN(id))
          console.log("📊 User subscription IDs:", userSubIds)

          // Check if user has ANY of the target subscriptions
          const hasMatchingSubscription = targetSubIds.some((targetId) => userSubIds.includes(targetId))

          console.log("🔍 Subscription match check:", {
            targetSubIds,
            userSubIds,
            hasMatchingSubscription,
          })

          isAllowed = hasMatchingSubscription
        } else {
          console.log("❌ User has no subscriptions")
          isAllowed = false
        }
      } else if (targetSubscriptionIds && !Array.isArray(targetSubscriptionIds)) {
        // Handle single subscription ID
        const singleSubId =
          typeof targetSubscriptionIds === "string"
            ? Number.parseInt(targetSubscriptionIds)
            : Number(targetSubscriptionIds)
        console.log("🔍 Single subscription ID check:", singleSubId)

        const { data: userSubscriptions, error: subError } = await supabase
          .from("user_subscriptions")
          .select("subscription_id")
          .eq("user_id", userIdNum)
          .eq("subscription_id", singleSubId)

        isAllowed = !subError && userSubscriptions && userSubscriptions.length > 0
        console.log("🔍 Single subscription check result:", isAllowed)
      } else {
        console.log("❌ Invalid target_ids format for subscription targeting:", targetSubscriptionIds)
        isAllowed = false
      }
    } else {
      console.log("❌ Unknown target_type:", link.target_type)
      isAllowed = false
    }

    if (!isAllowed) {
      console.log("❌ Final result: User not authorized for this link")

      // Enhanced debug information
      const debugInfo = {
        target_type: link.target_type,
        target_ids: link.target_ids,
        user_id: userId,
        user_id_num: userIdNum,
        link_id: link.id,
        link_title: link.title,
      }

      console.log("🔍 Debug info:", debugInfo)

      return NextResponse.json(
        {
          success: false,
          error: "You are not authorized to use this link. Please check your subscription status or contact support.",
          debug: debugInfo,
        },
        { status: 403 },
      )
    }

    console.log("✅ Final result: User authorized, returning success")
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
