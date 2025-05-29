import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = getSupabaseServerClient()
    const { token } = params

    console.log("🔗 Using link with token:", token)

    // Get user ID from cookies
    const userId = request.cookies.get("userId")?.value
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Login required",
        },
        { status: 401 },
      )
    }

    // First validate the link (reuse validation logic)
    const validateResponse = await fetch(`${request.nextUrl.origin}/api/links/validate/${token}`, {
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
    })

    if (!validateResponse.ok) {
      const validateData = await validateResponse.json()
      return NextResponse.json(validateData, { status: validateResponse.status })
    }

    const { link } = await validateResponse.json()

    // For WhatsApp links, check if already used
    if (link.link_type === "whatsapp") {
      const { data: existingUsage } = await supabase
        .from("link_usages")
        .select("id")
        .eq("link_id", link.id)
        .eq("user_id", Number.parseInt(userId))
        .single()

      if (existingUsage) {
        return NextResponse.json(
          {
            success: false,
            error: "You have already used this WhatsApp link. Contact admin for additional access.",
          },
          { status: 403 },
        )
      }
    }

    // Record usage
    const { error: usageError } = await supabase.from("link_usages").insert({
      link_id: link.id,
      user_id: Number.parseInt(userId),
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
      success: true,
    })

    if (usageError) {
      console.error("❌ Error recording usage:", usageError)
    }

    console.log("✅ Link used successfully, redirecting to:", link.target_url)

    return NextResponse.json({
      success: true,
      target_url: link.target_url,
      link_type: link.link_type,
    })
  } catch (error) {
    console.error("❌ Usage error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
