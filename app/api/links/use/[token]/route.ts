import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    console.log("🔍 Starting link usage for token:", params.token)

    const token = params.token
    if (!token) {
      console.error("❌ No token provided")
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 400 })
    }

    const supabase = createClient()
    console.log("✅ Supabase client created")

    // Get the current user ID from the request cookies
    const userId = request.cookies.get("userId")?.value
    console.log("👤 User ID from cookies:", userId || "Not logged in")

    if (!userId) {
      console.log("❌ User not logged in")
      return NextResponse.json({ success: false, error: "Login required" }, { status: 401 })
    }

    // Fetch the link
    console.log("🔍 Fetching link from database...")
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
      link_type: link.link_type,
      target_url: link.target_url,
    })

    // For WhatsApp links, check if user has already used this link
    if (link.link_type === "whatsapp") {
      console.log("🔍 Checking WhatsApp link usage...")

      const { data: existingUsage, error: usageError } = await supabase
        .from("link_usage")
        .select("*")
        .eq("link_id", link.id)
        .eq("user_id", userId)
        .single()

      if (usageError && usageError.code !== "PGRST116") {
        // PGRST116 = no rows found
        console.error("❌ Error checking link usage:", usageError)
        return NextResponse.json({ success: false, error: "Error checking link usage" }, { status: 500 })
      }

      if (existingUsage) {
        console.log("❌ WhatsApp link already used by user")
        return NextResponse.json(
          {
            success: false,
            error: "You have already used this WhatsApp link. Please request additional access if needed.",
          },
          { status: 403 },
        )
      }

      // Record the usage for WhatsApp links
      console.log("📝 Recording WhatsApp link usage...")
      const { error: insertError } = await supabase.from("link_usage").insert({
        link_id: link.id,
        user_id: userId,
        used_at: new Date().toISOString(),
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      })

      if (insertError) {
        console.error("❌ Error recording link usage:", insertError)
        // Don't fail the request for this, just log it
      } else {
        console.log("✅ WhatsApp link usage recorded")
      }
    }

    // Update link statistics
    console.log("📊 Updating link statistics...")
    const { error: statsError } = await supabase
      .from("generated_links")
      .update({
        usage_count: (link.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", link.id)

    if (statsError) {
      console.error("❌ Error updating link stats:", statsError)
      // Don't fail the request for this, just log it
    } else {
      console.log("✅ Link statistics updated")
    }

    console.log("✅ Returning target URL:", link.target_url)
    return NextResponse.json({
      success: true,
      target_url: link.target_url,
      link_type: link.link_type,
    })
  } catch (error) {
    console.error("❌ Unexpected error in links/use route:", error)
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
