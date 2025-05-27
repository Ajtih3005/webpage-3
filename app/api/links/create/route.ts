import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()

    const {
      title,
      description,
      linkType,
      link_type,
      target_url,
      targetUrl,
      target_type,
      targetType,
      target_ids,
      targetIds,
      expires_at,
      expiresAt,
      created_by,
    } = data

    // Handle both camelCase and snake_case field names
    const finalTitle = title
    const finalDescription = description || ""
    const finalLinkType = linkType || link_type || "session"
    const finalTargetUrl = targetUrl || target_url
    const finalTargetType = targetType || target_type || "all"
    const finalTargetIds = targetIds || target_ids || null
    const finalExpiresAt = expiresAt || expires_at || null
    const finalCreatedBy = created_by || null

    // Validate required fields
    if (!finalTitle || !finalLinkType || !finalTargetUrl || !finalTargetType) {
      console.error("Missing required fields:", {
        title: finalTitle,
        linkType: finalLinkType,
        targetUrl: finalTargetUrl,
        targetType: finalTargetType,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          details: {
            title: !finalTitle ? "Title is required" : null,
            linkType: !finalLinkType ? "Link type is required" : null,
            targetUrl: !finalTargetUrl ? "Target URL is required" : null,
            targetType: !finalTargetType ? "Target type is required" : null,
          },
        },
        { status: 400 },
      )
    }

    // Generate a random token
    const token = randomBytes(8).toString("hex")

    // Insert the new link
    const { data: link, error } = await supabase
      .from("generated_links")
      .insert({
        title: finalTitle,
        description: finalDescription,
        link_type: finalLinkType,
        token,
        target_url: finalTargetUrl,
        target_type: finalTargetType,
        target_ids: finalTargetIds,
        expires_at: finalExpiresAt,
        created_by: finalCreatedBy,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating link:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      link,
      full_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/l/${token}`,
    })
  } catch (error) {
    console.error("Error in links/create route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
