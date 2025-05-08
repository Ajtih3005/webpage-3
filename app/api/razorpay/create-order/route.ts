import { NextResponse } from "next/server"
import Razorpay from "razorpay"

export async function POST(request: Request) {
  try {
    const { amount, subscriptionId, userId, notes } = await request.json()

    if (!amount || !subscriptionId || !userId) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    // Initialize Razorpay with the environment variables
    const key_id = process.env.RAZORPAY_KEY_ID || ""
    const key_secret = process.env.RAZORPAY_KEY_SECRET || ""

    if (!key_id || !key_secret) {
      console.error("Razorpay credentials not configured properly")
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway not configured",
          details: "Missing API keys. Please contact the administrator.",
        },
        { status: 500 },
      )
    }

    // Log the key type for debugging
    const keyType = key_id.startsWith("rzp_test_") ? "TEST" : "LIVE"
    console.log(`Creating Razorpay order with ${keyType} key: ${key_id.substring(0, 10)}...`)

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      console.error(`Invalid amount: ${amount}`)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid amount",
          details: `Amount must be a positive number. Received: ${amount}`,
        },
        { status: 400 },
      )
    }

    // Convert amount to paise (Razorpay requires amount in smallest currency unit)
    // Use Math.round to ensure we get an integer
    const orderAmount = Math.round(amount * 100) // Convert to paise and ensure it's an integer

    // Double-check the conversion
    if (orderAmount <= 0) {
      console.error(`Invalid amount conversion: ${amount} INR converted to ${orderAmount} paise`)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid amount conversion",
          details: `Amount conversion resulted in invalid value: ${orderAmount} paise`,
        },
        { status: 400 },
      )
    }

    console.log(`Order amount: ${amount} INR (${orderAmount} paise)`)

    try {
      // Initialize Razorpay
      const razorpay = new Razorpay({
        key_id,
        key_secret,
      })

      // Create order with detailed error handling
      const orderOptions = {
        amount: orderAmount,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          subscriptionId: subscriptionId.toString(),
          userId,
          original_amount: amount.toString(),
          ...notes,
        },
      }

      console.log("Creating order with options:", {
        amount: orderOptions.amount,
        currency: orderOptions.currency,
        receipt: orderOptions.receipt,
      })

      const order = await razorpay.orders.create(orderOptions)
      console.log("Order created successfully:", order.id)
      console.log("Order amount:", order.amount, "paise")

      return NextResponse.json({ success: true, order })
    } catch (razorpayError: any) {
      console.error("Razorpay API error:", razorpayError)

      // Extract detailed error information
      const errorDetails = razorpayError.error
        ? `${razorpayError.error.code}: ${razorpayError.error.description}`
        : razorpayError.message || String(razorpayError)

      return NextResponse.json(
        {
          success: false,
          error: "Razorpay API error",
          details: errorDetails,
          code: razorpayError.statusCode || 500,
        },
        { status: razorpayError.statusCode || 500 },
      )
    }
  } catch (error) {
    console.error("Error creating Razorpay order:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
