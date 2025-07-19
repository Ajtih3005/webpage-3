import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST() {
  try {
    const supabase = getSupabaseServerClient()

    // Get all active subscriptions that have been activated
    const { data: activeSubscriptions, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        user_id,
        subscription_id,
        is_active,
        activation_date,
        total_active_days_used,
        subscriptions!inner(duration_days, name)
      `)
      .eq("is_active", true)
      .not("activation_date", "is", null)

    if (fetchError) {
      console.error("Error fetching active subscriptions:", fetchError)
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active subscriptions to update",
        updated: 0,
      })
    }

    const today = new Date()
    let updatedCount = 0
    const results = []

    for (const subscription of activeSubscriptions) {
      const durationDays = subscription.subscriptions.duration_days
      const activationDate = new Date(subscription.activation_date)

      // Calculate days since activation (including today if activated today)
      const timeDiff = today.getTime() - activationDate.getTime()
      const daysSinceActivation = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1 // +1 to include activation day

      // Cap at duration days
      const newTotalDays = Math.min(Math.max(daysSinceActivation, 0), durationDays)
      const currentDays = subscription.total_active_days_used || 0

      // Only update if the calculated days are different from stored days
      if (newTotalDays !== currentDays) {
        const shouldDeactivate = newTotalDays >= durationDays

        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            total_active_days_used: newTotalDays,
            is_active: !shouldDeactivate, // Deactivate if all days used
          })
          .eq("id", subscription.id)

        if (updateError) {
          console.error(`Error updating subscription ${subscription.id}:`, updateError)
          results.push({
            subscription_id: subscription.id,
            subscription_name: subscription.subscriptions.name,
            error: updateError.message,
          })
        } else {
          updatedCount++
          results.push({
            subscription_id: subscription.id,
            subscription_name: subscription.subscriptions.name,
            old_days: currentDays,
            new_days: newTotalDays,
            activation_date: subscription.activation_date,
            days_since_activation: daysSinceActivation,
            deactivated: shouldDeactivate,
          })
        }
      } else {
        results.push({
          subscription_id: subscription.id,
          subscription_name: subscription.subscriptions.name,
          days: currentDays,
          status: "no_change_needed",
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} subscriptions`,
      updated: updatedCount,
      total_checked: activeSubscriptions.length,
      results: results,
    })
  } catch (error) {
    console.error("Error updating subscription days:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update subscription days",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Allow GET requests for manual testing
export async function GET() {
  return POST()
}
