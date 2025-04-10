import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

// This is a webhook handler that payment gateways will call after successful payment
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServerClient()
    const payload = await request.json()

    // 1. Verify the webhook signature (implementation depends on payment gateway)
    // const isValid = verifyWebhookSignature(payload, request.headers)
    // if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 })

    // 2. Extract payment information
    const { payment_id, user_id, subscription_id, amount, status, transaction_id } = payload

    // 3. Update user subscription in database
    if (status === "success") {
      // Calculate subscription end date based on duration
      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("duration_days")
        .eq("id", subscription_id)
        .single()

      if (!subscriptionData) {
        return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
      }

      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + subscriptionData.duration_days)

      // Create user subscription record
      const { error } = await supabase.from("user_subscriptions").insert([
        {
          user_id,
          subscription_id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
          payment_id: payment_id || transaction_id,
          amount,
        },
      ])

      if (error) {
        console.error("Error creating subscription:", error)
        return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
      }

      // Optional: Create payment record in a separate payments table
      await supabase.from("payments").insert([
        {
          user_id,
          subscription_id,
          amount,
          payment_id: payment_id || transaction_id,
          status,
          payment_date: new Date().toISOString(),
        },
      ])

      return NextResponse.json({ success: true })
    } else {
      // Handle failed payment
      return NextResponse.json({ message: "Payment failed or pending" })
    }
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
