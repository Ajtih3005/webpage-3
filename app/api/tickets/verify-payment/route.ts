import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import crypto from "crypto"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, event_id, attendees, influencer_code, referral_code, discount_applied, original_price } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing payment details" }, { status: 400 })
    }

    if (!event_id || !attendees || !Array.isArray(attendees) || attendees.length === 0) {
      return NextResponse.json({ success: false, error: "Missing event or attendee details" }, { status: 400 })
    }

    // Get Razorpay credentials
    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET
    
    if (!key_id || !key_secret) {
      return NextResponse.json({ success: false, error: "Payment gateway not configured" }, { status: 500 })
    }

    // Method 1: Try signature verification first
    const body_data = razorpay_order_id + "|" + razorpay_payment_id
    const expected_signature = crypto
      .createHmac("sha256", key_secret)
      .update(body_data)
      .digest("hex")

    let paymentVerified = expected_signature === razorpay_signature

    // Method 2: If signature fails, verify via Razorpay API directly
    if (!paymentVerified) {
      try {
        const authHeader = Buffer.from(`${key_id}:${key_secret}`).toString("base64")
        const paymentResponse = await fetch(
          `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
          {
            headers: {
              Authorization: `Basic ${authHeader}`,
            },
          }
        )

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json()
          // Check if payment is captured and matches the order
          if (
            paymentData.status === "captured" &&
            paymentData.order_id === razorpay_order_id
          ) {
            paymentVerified = true
          }
        }
      } catch (apiError) {
        // API verification failed, continue with signature result
      }
    }

    if (!paymentVerified) {
      return NextResponse.json({ 
        success: false, 
        error: "Payment verification failed" 
      }, { status: 400 })
    }

    // Payment verified - now create bookings in database
    const supabase = getSupabaseServerClient()
    const createdBookings = []
    const errors = []

    for (const attendee of attendees) {
      // Generate unique QR code data
      const qrCodeData = `TICKET-${uuidv4()}`

      // Insert booking with CORRECT column names matching the database schema
      const bookingData: Record<string, any> = {
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
      
      // Add tracking data if provided
      if (influencer_code) bookingData.influencer_code = influencer_code
      if (referral_code) bookingData.referral_code_used = referral_code
      if (discount_applied) bookingData.discount_applied = discount_applied
      if (original_price) bookingData.original_price = original_price

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
