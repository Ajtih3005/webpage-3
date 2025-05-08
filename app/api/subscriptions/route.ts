import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Fetch all subscriptions
    const { data: subscriptions, error } = await supabase.from("subscriptions").select("id, name").order("name")

    if (error) {
      console.error("Error fetching subscriptions:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, subscriptions })
  } catch (error) {
    console.error("Unexpected error in subscriptions API:", error)
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 })
  }
}
