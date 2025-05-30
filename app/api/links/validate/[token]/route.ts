import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = getSupabaseServerClient()
    const { token } = params

    console.log("🔍 Validating token:", token)
    console.log("🍪 All cookies received:", request.cookies.getAll())

    // Get the link from generated_links table
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

    console.log("✅ Link found:", {
      id: link.id,
      title: link.title,
      target_type: link.target_type,
      link_type: link.link_type,
    })

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

    // 🚨 COMPREHENSIVE LOGIN CHECK - Try all possible cookie names
    let userId = null
    const possibleCookieNames = [
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

    // Try each possible cookie name
    for (const cookieName of possibleCookieNames) {
      const cookieValue = request.cookies.get(cookieName)?.value
      if (cookieValue) {
        console.log(`✅ Found user cookie: ${cookieName} = ${cookieValue}`)
        userId = cookieValue
        break
      }
    }

    // Also check Authorization header
    const authHeader = request.headers.get("authorization")
    if (!userId && authHeader?.startsWith("Bearer ")) {
      userId = authHeader.substring(7)
      console.log("✅ Found user token in Authorization header")
    }

    console.log("👤 Final user ID:", userId)

    // 🚨 FORCE LOGIN CHECK - If no user ID found, ALWAYS require login
    if (!userId) {
      console.log("❌ NO USER ID FOUND - FORCING LOGIN")
      return NextResponse.json(
        {
          success: false,
          error: "Login required",
          requiresLogin: true,
          loginUrl: `/user/login?redirect=/l/${token}`,
          linkInfo: {
            title: link.title,
            description: link.description,
            link_type: link.link_type,
          },
          debug: {
            allCookies: request.cookies.getAll().map((c) => c.name),
            checkedCookieNames: possibleCookieNames,
            hasAuthHeader: !!authHeader,
          },
        },
        { status: 401 },
      )
    }

    console.log("✅ User is logged in, checking authorization...")

    // Validate user exists in database
    const userIdNum = Number.parseInt(userId)
    if (isNaN(userIdNum)) {
      console.log("❌ Invalid user ID format:", userId)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user session",
          requiresLogin: true,
          loginUrl: `/user/login?redirect=/l/${token}`,
        },
        { status: 401 },
      )
    }

    // Check if user exists in database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", userIdNum)
      .single()

    if (userError || !user) {
      console.log("❌ User not found in database:", userError)
      return NextResponse.json(
        {
          success: false,
          error: "User session invalid",
          requiresLogin: true,
          loginUrl: `/user/login?redirect=/l/${token}`,
        },
        { status: 401 },
      )
    }

    console.log("✅ User validated:", user.name)

    // Check authorization based on target type
    let isAuthorized = false

    console.log("🔍 Checking authorization for user:", userIdNum, "Target type:", link.target_type)

    switch (link.target_type) {
      case "all":
        isAuthorized = true
        console.log("✅ All users allowed")
        break

      case "user":
      case "users":
        if (link.target_ids) {
          let allowedUserIds = []

          if (Array.isArray(link.target_ids)) {
            allowedUserIds = link.target_ids.map((id) => Number(id))
          } else if (typeof link.target_ids === "string") {
            try {
              allowedUserIds = JSON.parse(link.target_ids).map((id) => Number(id))
            } catch {
              allowedUserIds = link.target_ids.split(",").map((id) => Number(id.trim()))
            }
          }

          isAuthorized = allowedUserIds.includes(userIdNum)
          console.log("🔍 User check:", { allowedUserIds, userIdNum, isAuthorized })
        }
        break

      case "subscription":
        if (link.target_ids) {
          let allowedSubIds = []

          if (Array.isArray(link.target_ids)) {
            allowedSubIds = link.target_ids.map((id) => Number(id))
          } else if (typeof link.target_ids === "string") {
            try {
              allowedSubIds = JSON.parse(link.target_ids).map((id) => Number(id))
            } catch {
              allowedSubIds = link.target_ids.split(",").map((id) => Number(id.trim()))
            }
          }

          console.log("🔍 Checking subscriptions:", allowedSubIds)

          const { data: userSubs, error: subError } = await supabase
            .from("user_subscriptions")
            .select("subscription_id")
            .eq("user_id", userIdNum)

          if (!subError && userSubs && userSubs.length > 0) {
            const userSubIds = userSubs.map((sub) => sub.subscription_id)
            isAuthorized = allowedSubIds.some((subId) => userSubIds.includes(subId))
            console.log("🔍 Subscription check:", { allowedSubIds, userSubIds, isAuthorized })
          } else {
            console.log("❌ User has no subscriptions or error:", subError)
            isAuthorized = false
          }
        }
        break

      default:
        console.log("❌ Unknown target_type:", link.target_type)
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
      userInfo: {
        id: user.id,
        name: user.name,
        email: user.email,
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
