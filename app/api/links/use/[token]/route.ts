import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token
    const supabase = createClient()

    // Get the current user ID from the request cookies
    const userId = request.cookies.get("userId")?.value
    if (!userId) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 })
    }

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

    // Check if the user is allowed to use this link
    let isAllowed = false

    if (link.target_type === "all") {
      isAllowed = true
    } else if (link.target_type === "user" && link.target_ids && link.target_ids.includes(Number.parseInt(userId))) {
      isAllowed = true
    } else if (link.target_type === "users") {
      isAllowed = true
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

    // Check if the user has already used this link
    const { data: existingUsage, error: usageCheckError } = await supabase
      .from("link_usages")
      .select("*")
      .eq("link_id", link.id)
      .eq("user_id", Number.parseInt(userId))
      .single()

    // For WhatsApp links, check if the user has reached their usage limit
    if (link.link_type === "whatsapp" && existingUsage) {
      // User has already used this link
      return NextResponse.json(
        {
          success: false,
          error: "You have already used this link. Please contact an admin for additional access.",
          target_url: link.target_url, // Still provide the URL so the frontend can handle appropriately
        },
        { status: 403 },
      )
    }

    // Record the usage
    const userAgent = request.headers.get("user-agent") || ""
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    const { error: usageError } = await supabase.from("link_usages").upsert(
      {
        link_id: link.id,
        user_id: Number.parseInt(userId),
        used_at: new Date().toISOString(),
        user_agent: userAgent,
        ip_address: ip,
      },
      {
        onConflict: "link_id,user_id",
      },
    )

    if (usageError) {
      console.error("Error recording link usage:", usageError)
      // Continue anyway, don't block the user
    }

    return NextResponse.json({
      success: true,
      target_url: link.target_url,
    })
  } catch (error) {
    console.error("Error in links/use route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
