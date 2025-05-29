import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    console.log("🔍 Starting link usage for token:", params.token)

    const token = params.token
    const supabase = getSupabaseServerClient()

    // Get the current user ID from the request cookies
    const userId = request.cookies.get("userId")?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: "Login required" }, { status: 401 })
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

    // For WhatsApp links, check if user has already used this link
    if (link.link_type === "whatsapp") {
      console.log("🔍 Checking WhatsApp link usage...")

      // Check if link_usages table exists, if not create it
      const { data: existingUsage, error: usageError } = await supabase
        .from("link_usages")
        .select("*")
        .eq("link_id", link.id)
        .eq("user_id", userId)
        .single()

      if (usageError && usageError.code !== "PGRST116") {
        // PGRST116 = no rows found, which is fine
        console.error("❌ Error checking link usage:", usageError)
        // Continue anyway for now
      }

      if (existingUsage) {
        console.log("❌ WhatsApp link already used by user")
        return NextResponse.json(
          {
            success: false,
            error: "You have already used this WhatsApp link. Please contact admin for additional access.",
          },
          { status: 403 },
        )
      }

      // Record the usage for WhatsApp links
      console.log("📝 Recording WhatsApp link usage...")
      const { error: insertError } = await supabase.from("link_usages").upsert({
        link_id: link.id,
        user_id: Number.parseInt(userId),
        used_at: new Date().toISOString(),
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      })

      if (insertError) {
        console.error("❌ Error recording link usage:", insertError)
        // Don't fail the request for this, just log it
      }
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
