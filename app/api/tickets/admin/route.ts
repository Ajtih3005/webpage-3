import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

// GET - List all events for admin (including inactive)
export async function GET(request: Request) {
  const authHeader = request.headers.get("x-admin-password")
  if (authHeader !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getSupabaseServerClient()

    const { data: events, error } = await supabase
      .from("event_tickets")
      .select("*")
      .order("event_date", { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, events })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch events" }, { status: 500 })
  }
}

// PUT - Update event
export async function PUT(request: Request) {
  const authHeader = request.headers.get("x-admin-password")
  if (authHeader !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Event ID required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    const { data: event, error } = await supabase
      .from("event_tickets")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, event })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update event" }, { status: 500 })
  }
}

// DELETE - Delete event
export async function DELETE(request: Request) {
  const authHeader = request.headers.get("x-admin-password")
  if (authHeader !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Event ID required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    const { error } = await supabase
      .from("event_tickets")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Event deleted" })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete event" }, { status: 500 })
  }
}
