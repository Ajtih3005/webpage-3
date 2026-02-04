import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id, booking_ids } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing payment details" }, { status: 400 })
    }

    // Support both single booking_id and multiple booking_ids
    const idsToUpdate = booking_ids || (booking_id ? [booking_id] : [])
    
    if (idsToUpdate.length === 0) {
      return NextResponse.json({ success: false, error: "No booking IDs provided" }, { status: 400 })
    }

    // Verify signature
    const key_secret = process.env.RAZORPAY_KEY_SECRET || ""
    const body_data = razorpay_order_id + "|" + razorpay_payment_id
    const expected_signature = crypto
      .createHmac("sha256", key_secret)
      .update(body_data)
      .digest("hex")

    if (expected_signature !== razorpay_signature) {
      console.error("[v0] Signature mismatch")
      return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Update all bookings as paid
    const { data: bookings, error } = await supabase
      .from("ticket_bookings")
      .update({
        is_paid: true,
        payment_id: razorpay_payment_id,
        razorpay_signature,
      })
      .in("id", idsToUpdate)
      .select(`
        *,
        event_tickets (*)
      `)

    if (error) {
      console.error("[v0] Error updating bookings:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      bookings,
      booking: bookings?.[0], // For backward compatibility
      message: "Payment verified successfully",
    })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to verify payment" }, { status: 500 })
  }
}
