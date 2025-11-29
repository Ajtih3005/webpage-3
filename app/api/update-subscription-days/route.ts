import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST() {
  try {
    const supabase = getSupabaseServerClient()

    const { data: userSubscriptions, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        user_id,
        subscription_id,
        activation_date,
        total_active_days_used,
        is_active,
        subscription:subscriptions (
          duration_days,
          is_active
        )
      `)
      .not("activation_date", "is", null)

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError)
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    if (!userSubscriptions || userSubscriptions.length === 0) {
      return NextResponse.json({
        message: "No subscriptions to update",
        updated: 0,
      })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let updatedCount = 0
    let skippedDueToInactiveSubscription = 0
    let alreadyExpiredCount = 0

    for (const subscription of userSubscriptions) {
      try {
        const baseDurationDays = subscription.subscription?.duration_days || 30
        const durationDays = baseDurationDays + 3 // 30 days becomes 33 days total
        const currentDaysUsed = subscription.total_active_days_used || 0

        // Skip if already fully expired (reached max days including bonus)
        if (currentDaysUsed >= durationDays) {
          if (subscription.is_active) {
            await supabase.from("user_subscriptions").update({ is_active: false }).eq("id", subscription.id)
          }
          alreadyExpiredCount++
          continue
        }

        // This is the ONLY control for whether days should count
        if (!subscription.subscription?.is_active) {
          skippedDueToInactiveSubscription++
          console.log(`[v0] Skipping subscription ${subscription.id}: Admin has turned OFF subscription plan`)
          continue
        }

        const newDaysUsed = currentDaysUsed + 1
        const shouldExpire = newDaysUsed >= durationDays

        // Update the subscription
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            total_active_days_used: newDaysUsed,
            is_active: !shouldExpire,
            ...(shouldExpire && {
              activation_notes: `Expired: Reached ${durationDays} days (${baseDurationDays} + 3 bonus) on ${today.toISOString().split("T")[0]}`,
            }),
          })
          .eq("id", subscription.id)

        if (updateError) {
          console.error(`Error updating subscription ${subscription.id}:`, updateError)
          continue
        }

        updatedCount++

        console.log(
          `[v0] Subscription ${subscription.id}: ${currentDaysUsed} → ${newDaysUsed} days${shouldExpire ? " (NOW EXPIRED)" : ""}`,
        )
      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error)
        continue
      }
    }

    return NextResponse.json({
      message: `Updated ${updatedCount} subscriptions`,
      updated: updatedCount,
      total_checked: userSubscriptions.length,
      skipped_admin_off: skippedDueToInactiveSubscription,
      already_expired: alreadyExpiredCount,
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
  return POST()
}
