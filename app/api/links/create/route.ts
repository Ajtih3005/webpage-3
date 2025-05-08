import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const data = await request.json()

    const { title, description, link_type, target_url, target_type, target_ids, expires_at, created_by } = data

    // Validate required fields
    if (!title || !link_type || !target_url || !target_type) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Generate a random token
    const token = randomBytes(8).toString("hex")

    // Insert the new link
    const { data: link, error } = await supabase
      .from("generated_links")
      .insert({
        title,
        description,
        link_type,
        token,
        target_url,
        target_type,
        target_ids,
        expires_at: expires_at || null,
        created_by,
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
      full_url: `${process.env.NEXT_PUBLIC_APP_URL}/l/${token}`,
    })
  } catch (error) {
    console.error("Error in links/create route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
