import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import crypto from "crypto"
import { v4 as uuidv4 } from "uuid"
import QRCode from "qrcode"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, event_id, attendees } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing payment details" }, { status: 400 })
    }

    if (!event_id || !attendees || !Array.isArray(attendees) || attendees.length === 0) {
      return NextResponse.json({ success: false, error: "Missing event or attendee details" }, { status: 400 })
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

    // Payment verified - now create bookings in database
    const supabase = getSupabaseServerClient()
    const createdBookings = []

    for (const attendee of attendees) {
      // Generate unique QR code data
      const qrCodeData = `TICKET-${uuidv4()}`
      
      // Generate QR code image as base64
      let qrCodeImage = null
      try {
        qrCodeImage = await QRCode.toDataURL(qrCodeData, {
          width: 300,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        })
      } catch (qrError) {
        console.error("[v0] QR generation error:", qrError)
      }

      // Insert booking
      const { data: booking, error } = await supabase
        .from("ticket_bookings")
        .insert({
          ticket_id: event_id,
          name: attendee.name,
          email: attendee.email,
          phone: attendee.phone,
          is_paid: true,
          payment_id: razorpay_payment_id,
          razorpay_signature,
          qr_code_data: qrCodeData,
          qr_code_image: qrCodeImage,
        })
        .select(`
          *,
          event_tickets (*)
        `)
        .single()

      if (error) {
        console.error("[v0] Error creating booking:", error)
        // Continue with other bookings even if one fails
        continue
      }

      createdBookings.push(booking)
    }

    if (createdBookings.length === 0) {
      return NextResponse.json({ success: false, error: "Failed to create any bookings" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      bookings: createdBookings,
      booking: createdBookings[0], // For backward compatibility
      message: `Payment verified and ${createdBookings.length} ticket(s) booked successfully`,
    })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to verify payment" }, { status: 500 })
  }
}
