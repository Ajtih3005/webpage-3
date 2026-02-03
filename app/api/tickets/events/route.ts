import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

// GET - List all active events
export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    
    const { data: events, error } = await supabase
      .from("event_tickets")
      .select("*")
      .eq("is_active", true)
      .gte("event_date", new Date().toISOString().split("T")[0])
      .order("event_date", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching events:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, events })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch events" }, { status: 500 })
  }
}

// POST - Create new event (Admin only)
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("x-admin-password")
    if (authHeader !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { event_name, event_date, event_time, venue, description, ticket_price, total_seats, image_url } = body

    if (!event_name || !event_date || !event_time || !venue) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    const { data: event, error } = await supabase
      .from("event_tickets")
      .insert({
        event_name,
        event_date,
        event_time,
        venue,
        description: description || "",
        ticket_price: ticket_price || 0,
        total_seats: total_seats || 100,
        available_seats: total_seats || 100,
        image_url: image_url || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating event:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to create event" }, { status: 500 })
  }
}
