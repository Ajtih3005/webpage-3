import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { phone, passkey, user_id } = await request.json()

    if (!phone) {
      return NextResponse.json({ success: false, error: "Phone number required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // If user_id is provided, verify they're a registered user
    if (user_id) {
      const { data: user } = await supabase
        .from("users")
        .select("id, phone")
        .eq("id", user_id)
        .eq("phone", phone)
        .single()

      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }

      // Get all bookings for registered user
      const { data: bookings, error } = await supabase
        .from("ticket_bookings")
        .select(`
          *,
          event_tickets (*)
        `)
        .or(`user_id.eq.${user_id},booking_phone.eq.${phone}`)
        .eq("is_paid", true)
        .order("booking_date", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching bookings:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, bookings })
    }

    // For non-registered users, require passkey
    if (!passkey) {
      return NextResponse.json({ success: false, error: "Passkey required for non-registered users" }, { status: 400 })
    }

    // Get bookings by phone and passkey
    const { data: bookings, error } = await supabase
      .from("ticket_bookings")
      .select(`
        *,
        event_tickets (*)
      `)
      .eq("booking_phone", phone)
      .eq("passkey", passkey)
      .eq("is_paid", true)
      .order("booking_date", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching bookings:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ success: false, error: "No bookings found or invalid passkey" }, { status: 404 })
    }

    return NextResponse.json({ success: true, bookings })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch bookings" }, { status: 500 })
  }
}
