import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { bookings, amount, event_name } = body

    if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
      return NextResponse.json({ success: false, error: "No bookings provided" }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 })
    }

    const key_id = process.env.RAZORPAY_KEY_ID || ""
    const key_secret = process.env.RAZORPAY_KEY_SECRET || ""

    if (!key_id || !key_secret) {
      return NextResponse.json({ success: false, error: "Payment gateway not configured" }, { status: 500 })
    }

    const orderAmount = Math.round(amount * 100) // Convert to paise
    const authHeader = `Basic ${Buffer.from(`${key_id}:${key_secret}`).toString("base64")}`

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: orderAmount,
        currency: "INR",
        receipt: `tickets_${bookings[0]}_${Date.now()}`,
        notes: {
          booking_ids: bookings.join(","),
          event_name: event_name || "Event Ticket",
          ticket_count: bookings.length,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Razorpay order creation failed:", errorText)
      return NextResponse.json({ success: false, error: "Failed to create payment order" }, { status: 500 })
    }

    const order = await response.json()

    return NextResponse.json({
      success: true,
      order,
    })
  } catch (error) {
    console.error("[v0] Error creating combined order:", error)
    return NextResponse.json({ success: false, error: "Failed to create order" }, { status: 500 })
  }
}
