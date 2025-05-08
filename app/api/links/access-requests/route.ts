import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createClient()

    // Get all pending access requests with user and subscription details
    const { data, error } = await supabase
      .from("whatsapp_access_requests")
      .select(`
        id,
        user_id,
        subscription_id,
        status,
        created_at,
        updated_at,
        user:users(id, name, email),
        subscription:subscriptions(id, name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching access requests:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      requests: data,
    })
  } catch (error) {
    console.error("Error in access-requests route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
