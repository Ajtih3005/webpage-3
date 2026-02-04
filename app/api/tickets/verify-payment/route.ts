import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import crypto from "crypto"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, event_id, attendees } = body

    console.log("[v0] Verify payment called with:", { 
      razorpay_order_id, 
      razorpay_payment_id, 
      event_id, 
      attendeesCount: attendees?.length 
    })

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("[v0] Missing payment details:", { razorpay_order_id, razorpay_payment_id, razorpay_signature: !!razorpay_signature })
      return NextResponse.json({ success: false, error: "Missing payment details" }, { status: 400 })
    }

    if (!event_id || !attendees || !Array.isArray(attendees) || attendees.length === 0) {
      console.error("[v0] Missing event or attendee details:", { event_id, attendees })
      return NextResponse.json({ success: false, error: "Missing event or attendee details" }, { status: 400 })
    }

    // Verify signature
    const key_secret = process.env.RAZORPAY_KEY_SECRET
    
    if (!key_secret) {
      console.error("[v0] RAZORPAY_KEY_SECRET is not configured")
      return NextResponse.json({ success: false, error: "Payment gateway not configured" }, { status: 500 })
    }

    const body_data = razorpay_order_id + "|" + razorpay_payment_id
    const expected_signature = crypto
      .createHmac("sha256", key_secret)
      .update(body_data)
      .digest("hex")

    console.log("[v0] Signature verification:", {
      bodyData: body_data,
      expectedSignatureLength: expected_signature.length,
      receivedSignatureLength: razorpay_signature.length,
      match: expected_signature === razorpay_signature
    })

    if (expected_signature !== razorpay_signature) {
      console.error("[v0] Signature mismatch - payment verification failed")
      return NextResponse.json({ success: false, error: "Payment verification failed - signature mismatch" }, { status: 400 })
    }

    console.log("[v0] Payment signature verified successfully")

    // Payment verified - now create bookings in database
    const supabase = getSupabaseServerClient()
    const createdBookings = []
    const errors = []

    for (const attendee of attendees) {
      // Generate unique QR code data
      const qrCodeData = `TICKET-${uuidv4()}`

      // Insert booking with CORRECT column names matching the database schema
      const bookingData = {
        ticket_id: event_id,
        booking_name: attendee.name,
        booking_email: attendee.email,
        booking_phone: attendee.phone,
        is_paid: true,
        payment_id: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        razorpay_signature: razorpay_signature,
        qr_code_data: qrCodeData,
      }

      console.log("[v0] Inserting booking:", bookingData)

      const { data: booking, error } = await supabase
        .from("ticket_bookings")
        .insert(bookingData)
        .select(`
          *,
          event_tickets (*)
        `)
        .single()

      if (error) {
        console.error("[v0] Error creating booking:", error)
        errors.push({ attendee: attendee.name, error: error.message })
        continue
      }

      console.log("[v0] Booking created successfully:", booking.id)
      createdBookings.push(booking)
    }

    if (createdBookings.length === 0) {
      console.error("[v0] Failed to create any bookings. Errors:", errors)
      return NextResponse.json({ 
        success: false, 
        error: "Failed to create any bookings",
        details: errors 
      }, { status: 500 })
    }

    console.log("[v0] Successfully created", createdBookings.length, "bookings")

    return NextResponse.json({
      success: true,
      bookings: createdBookings,
      booking: createdBookings[0], // For backward compatibility
      message: `Payment verified and ${createdBookings.length} ticket(s) booked successfully`,
    })
  } catch (error) {
    console.error("[v0] Error in verify-payment:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to verify payment" 
    }, { status: 500 })
  }
}
