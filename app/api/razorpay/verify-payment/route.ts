import { NextResponse } from "next/server"
import crypto from "crypto"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscriptionId,
      userId,
      amount,
      duration_days,
    } = await request.json()

    // Verify the payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!).update(body).digest("hex")

    const isAuthentic = expectedSignature === razorpay_signature

    if (!isAuthentic) {
      return NextResponse.json({ success: false, error: "Invalid payment signature" }, { status: 400 })
    }

    // Initialize Supabase client
    const supabase = getSupabaseServerClient()

    // Calculate subscription dates
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + duration_days)

    // Insert the subscription record
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error("Error creating subscription:", subscriptionError)
      return NextResponse.json({ success: false, error: "Failed to create subscription" }, { status: 500 })
    }

    // Record the payment
    const { error: paymentError } = await supabase.from("payments").insert({
      user_id: userId,
      subscription_id: subscriptionId,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      amount: amount,
      status: "completed",
      payment_date: new Date().toISOString(),
    })

    if (paymentError) {
      console.error("Error recording payment:", paymentError)
      // Continue anyway since the subscription was created
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and subscription activated",
      subscription: subscriptionData,
    })
  } catch (error) {
    console.error("Error verifying payment:", error)
    return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 500 })
  }
}
