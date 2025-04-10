import { NextResponse } from "next/server"
import Razorpay from "razorpay"

export async function POST(request: Request) {
  try {
    const { amount, subscriptionId, userId, notes = {} } = await request.json()

    if (!amount || !subscriptionId || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    // Create a unique receipt ID
    const receipt = `sub_${subscriptionId}_user_${userId}_${Date.now()}`

    // Create order in Razorpay
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // amount in paisa
      currency: "INR",
      receipt,
      notes: {
        subscriptionId,
        userId,
        ...notes,
      },
    })

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error("Error creating Razorpay order:", error)
    return NextResponse.json({ success: false, error: "Failed to create order" }, { status: 500 })
  }
}
