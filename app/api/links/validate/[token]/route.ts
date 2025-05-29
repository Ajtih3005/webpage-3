import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    console.log("🔍 Starting link validation for token:", params.token)

    const token = params.token
    if (!token) {
      console.error("❌ No token provided")
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 400 })
    }

    const supabase = createClient()
    console.log("✅ Supabase client created")

    // Get the current user ID from the request cookies (if logged in)
    const userId = request.cookies.get("userId")?.value
    console.log("👤 User ID from cookies:", userId || "Not logged in")

    // Fetch the link with better error handling
    console.log("🔍 Fetching link from database...")
    const { data: link, error } = await supabase
      .from("generated_links")
      .select("*")
      .eq("token", token)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error("❌ Database error fetching link:", error)
      return NextResponse.json({ success: false, error: "Link not found or inactive" }, { status: 404 })
    }

    if (!link) {
      console.error("❌ No link found for token:", token)
      return NextResponse.json({ success: false, error: "Link not found or inactive" }, { status: 404 })
    }

    console.log("✅ Link found:", {
      id: link.id,
      title: link.title,
      target_type: link.target_type,
      target_ids: link.target_ids,
      expires_at: link.expires_at,
    })

    // Check if the link has expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      console.log("❌ Link has expired:", link.expires_at)
      return NextResponse.json({ success: false, error: "Link has expired" }, { status: 403 })
    }

    // ALWAYS require login for ALL links
    if (!userId) {
      console.log("❌ User not logged in, requiring login")
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
    console.log("🔍 Checking user authorization...")

    try {
      if (link.target_type === "all") {
        console.log("✅ Link is for all users")
        isAllowed = true
      } else if (link.target_type === "user") {
        console.log("🔍 Checking single user access...")

        // Handle target_ids as either array or JSON string
        let targetIds = link.target_ids
        if (typeof targetIds === "string") {
          try {
            targetIds = JSON.parse(targetIds)
          } catch (e) {
            console.error("❌ Error parsing target_ids JSON:", e)
            targetIds = []
          }
        }

        console.log("Target IDs:", targetIds, "User ID:", userId)
        isAllowed = targetIds && targetIds.includes(Number.parseInt(userId))
        console.log("Single user access allowed:", isAllowed)
      } else if (link.target_type === "users") {
        console.log("🔍 Checking multiple users access...")

        // Handle target_ids as either array or JSON string
        let targetIds = link.target_ids
        if (typeof targetIds === "string") {
          try {
            targetIds = JSON.parse(targetIds)
          } catch (e) {
            console.error("❌ Error parsing target_ids JSON:", e)
            targetIds = []
          }
        }

        console.log("Target IDs:", targetIds, "User ID:", userId)
        isAllowed = targetIds && targetIds.includes(Number.parseInt(userId))
        console.log("Multiple users access allowed:", isAllowed)
      } else if (link.target_type === "subscription") {
        console.log("🔍 Checking subscription access...")

        // Handle target_ids as either array or JSON string
        let targetIds = link.target_ids
        if (typeof targetIds === "string") {
          try {
            targetIds = JSON.parse(targetIds)
          } catch (e) {
            console.error("❌ Error parsing target_ids JSON:", e)
            targetIds = []
          }
        }

        console.log("Subscription target IDs:", targetIds)

        // Check if the user has the specified subscription
        const { data: userSubscriptions, error: subError } = await supabase
          .from("user_subscriptions")
          .select("subscription_id")
          .eq("user_id", userId)

        if (subError) {
          console.error("❌ Error fetching user subscriptions:", subError)
          isAllowed = false
        } else if (userSubscriptions) {
          const userSubIds = userSubscriptions.map((sub) => sub.subscription_id)
          console.log("User subscription IDs:", userSubIds)
          isAllowed = targetIds && targetIds.some((id: number) => userSubIds.includes(id))
          console.log("Subscription access allowed:", isAllowed)
        }
      } else {
        console.log("❌ Unknown target_type:", link.target_type)
        isAllowed = false
      }
    } catch (authError) {
      console.error("❌ Error during authorization check:", authError)
      return NextResponse.json({ success: false, error: "Authorization check failed" }, { status: 500 })
    }

    if (!isAllowed) {
      console.log("❌ User not authorized for this link")
      return NextResponse.json({ success: false, error: "You are not authorized to use this link" }, { status: 403 })
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
