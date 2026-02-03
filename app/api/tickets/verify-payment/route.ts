import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
      return NextResponse.json({ success: false, error: "Missing payment details" }, { status: 400 })
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

    // Update booking as paid
    const { data: booking, error } = await supabase
      .from("ticket_bookings")
      .update({
        is_paid: true,
        payment_id: razorpay_payment_id,
        razorpay_signature,
      })
      .eq("id", booking_id)
      .select(`
        *,
        event_tickets (*)
      `)
      .single()

    if (error) {
      console.error("[v0] Error updating booking:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      booking,
      message: "Payment verified successfully",
    })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to verify payment" }, { status: 500 })
  }
}
