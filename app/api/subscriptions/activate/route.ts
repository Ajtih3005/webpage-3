import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServerClient()
    const { subscriptionId, activationDate, notes } = await request.json()

    if (!subscriptionId || !activationDate) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Get the subscription to calculate new end date
    const { data: subscription, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        subscription:subscriptions (duration_days)
      `)
      .eq("id", subscriptionId)
      .single()

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    // Calculate new end date based on activation date and duration
    const durationDays = subscription?.subscription?.duration_days || 30
    const activationDateObj = new Date(activationDate)
    const newEndDate = new Date(activationDateObj)
    newEndDate.setDate(newEndDate.getDate() + durationDays)

    // Update the subscription
    const { error } = await supabase
      .from("user_subscriptions")
      .update({
        is_active: true,
        activation_date: activationDateObj.toISOString(),
        admin_activated: true,
        activation_notes: notes || null,
        end_date: newEndDate.toISOString(), // Update end date based on activation date
      })
      .eq("id", subscriptionId)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Subscription activated successfully",
    })
  } catch (error: any) {
    console.error("Error activating subscription:", error)
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
