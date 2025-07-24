import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST() {
  try {
    const supabase = getSupabaseServerClient()

    // Get all user subscriptions that are currently active (is_active = true)
    const { data: activeSubscriptions, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        user_id,
        subscription_id,
        activation_date,
        total_active_days_used,
        last_day_counted,
        is_active,
        subscription:subscriptions (duration_days)
      `)
      .eq("is_active", true) // Only process active subscriptions

    if (fetchError) {
      console.error("Error fetching active subscriptions:", fetchError)
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      return NextResponse.json({
        message: "No active subscriptions to update",
        updated: 0,
      })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of day for consistent comparison

    let updatedCount = 0

    for (const subscription of activeSubscriptions) {
      try {
        // Skip if no activation date
        if (!subscription.activation_date) {
          continue
        }

        const activationDate = new Date(subscription.activation_date)
        activationDate.setHours(0, 0, 0, 0)

        // Skip if activation date is in the future
        if (activationDate > today) {
          continue
        }

        // Get the last day we counted (or activation date if never counted)
        const lastCountedDate = subscription.last_day_counted
          ? new Date(subscription.last_day_counted)
          : new Date(activationDate)
        lastCountedDate.setHours(0, 0, 0, 0)

        // Calculate days since last count
        const daysSinceLastCount = Math.floor((today.getTime() - lastCountedDate.getTime()) / (1000 * 60 * 60 * 24))

        // Only update if there are new days to count
        if (daysSinceLastCount > 0) {
          const currentDaysUsed = subscription.total_active_days_used || 0
          const newDaysUsed = currentDaysUsed + daysSinceLastCount
          const durationDays = subscription.subscription?.duration_days || 30

          // Check if subscription should be expired
          const shouldExpire = newDaysUsed >= durationDays

          // Update the subscription
          const { error: updateError } = await supabase
            .from("user_subscriptions")
            .update({
              total_active_days_used: Math.min(newDaysUsed, durationDays), // Cap at duration
              last_day_counted: today.toISOString(),
              is_active: !shouldExpire, // Set to false if expired
              ...(shouldExpire && {
                activation_notes: `Automatically expired after ${durationDays} days on ${today.toISOString().split("T")[0]}`,
              }),
            })
            .eq("id", subscription.id)

          if (updateError) {
            console.error(`Error updating subscription ${subscription.id}:`, updateError)
            continue
          }

          updatedCount++

          console.log(
            `Updated subscription ${subscription.id}: ${currentDaysUsed} -> ${Math.min(newDaysUsed, durationDays)} days${shouldExpire ? " (EXPIRED)" : ""}`,
          )
        }
      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error)
        continue
      }
    }

    return NextResponse.json({
      message: `Successfully updated ${updatedCount} subscriptions`,
      updated: updatedCount,
      total_checked: activeSubscriptions.length,
    })
  } catch (error) {
    console.error("Error in update-subscription-days:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  // Allow GET requests to trigger the update as well
  return POST()
}
