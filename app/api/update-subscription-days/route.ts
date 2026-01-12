import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const cronSecret = process.env.corn_secret
    const authHeader = request.headers.get("authorization")
    const vercelCronHeader = request.headers.get("x-vercel-cron-secret") || request.headers.get("x-cron-secret")

    // Allow either Vercel's cron header OR manual authorization for testing
    if (cronSecret && !vercelCronHeader && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[v0] ❌ Unauthorized cron request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] 🚀 Starting subscription day update API...")

    const supabase = getSupabaseServerClient()
    console.log("[v0] ✅ Supabase client created")

    console.log("[v0] 📊 Fetching user subscriptions...")
    const { data: userSubscriptions, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        user_id,
        subscription_id,
        activation_date,
        total_active_days_used,
        is_active,
        last_day_counted,
        subscription:subscriptions (
          duration_days,
          is_active
        )
      `)
      .not("activation_date", "is", null)

    if (fetchError) {
      console.error("[v0] ❌ Error fetching subscriptions:", fetchError)
      return NextResponse.json(
        {
          error: "Failed to fetch subscriptions",
          details: fetchError.message,
          code: fetchError.code,
        },
        { status: 500 },
      )
    }

    console.log("[v0] ✅ Found", userSubscriptions?.length || 0, "subscriptions")

    if (!userSubscriptions || userSubscriptions.length === 0) {
      return NextResponse.json({
        message: "No subscriptions to update",
        updated: 0,
      })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    console.log("[v0] 📅 Today's date:", today.toISOString().split("T")[0])

    let updatedCount = 0
    let skippedDueToInactiveSubscription = 0
    let alreadyExpiredCount = 0
    let backfilledCount = 0
    let errorCount = 0

    for (const subscription of userSubscriptions) {
      try {
        const baseDurationDays = subscription.subscription?.duration_days || 30
        const durationDays = baseDurationDays + 3
        const currentDaysUsed = subscription.total_active_days_used || 0

        console.log(`[v0] Processing subscription ${subscription.id}: current days = ${currentDaysUsed}`)

        // Skip if already fully expired
        if (currentDaysUsed >= durationDays) {
          if (subscription.is_active) {
            await supabase.from("user_subscriptions").update({ is_active: false }).eq("id", subscription.id)
          }
          alreadyExpiredCount++
          console.log(`[v0] ⏭️  Subscription ${subscription.id} already expired`)
          continue
        }

        // Check if subscription plan is active (admin control)
        if (!subscription.subscription?.is_active) {
          await supabase
            .from("user_subscriptions")
            .update({ last_day_counted: today.toISOString().split("T")[0] })
            .eq("id", subscription.id)

          skippedDueToInactiveSubscription++
          console.log(`[v0] ⏭️  Subscription ${subscription.id}: Admin turned OFF subscription plan`)
          continue
        }

        const activationDate = new Date(subscription.activation_date)
        activationDate.setHours(0, 0, 0, 0)

        // Calculate total days from activation to today (including Day 0)
        const daysSinceActivation = Math.floor((today.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24))

        // The correct days used should be daysSinceActivation (0-indexed, so day 0, day 1, day 2, etc.)
        const correctDaysUsed = Math.min(daysSinceActivation, durationDays)

        console.log(`[v0] 📊 Subscription ${subscription.id}:`)
        console.log(`      Activation: ${activationDate.toISOString().split("T")[0]}`)
        console.log(`      Days since activation: ${daysSinceActivation}`)
        console.log(`      Current days used: ${currentDaysUsed}`)
        console.log(`      Correct days used: ${correctDaysUsed}`)
        console.log(`      Duration limit: ${durationDays}`)

        // If current days is less than what it should be, we need to backfill
        if (correctDaysUsed > currentDaysUsed) {
          backfilledCount++
          console.log(
            `[v0] 🔄 BACKFILLING subscription ${subscription.id}: ${currentDaysUsed} → ${correctDaysUsed} days (caught up ${correctDaysUsed - currentDaysUsed} missed days)`,
          )
        }

        const shouldExpire = correctDaysUsed >= durationDays

        // Update the subscription with correct days
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            total_active_days_used: correctDaysUsed,
            is_active: !shouldExpire,
            last_day_counted: today.toISOString().split("T")[0],
            ...(shouldExpire && {
              activation_notes: `Expired: Reached ${durationDays} days (${baseDurationDays} + 3 bonus) on ${today.toISOString().split("T")[0]}`,
            }),
          })
          .eq("id", subscription.id)

        if (updateError) {
          console.error(`[v0] ❌ Error updating subscription ${subscription.id}:`, updateError)
          errorCount++
          continue
        }

        updatedCount++
        console.log(
          `[v0] ✅ Subscription ${subscription.id}: Days used = ${correctDaysUsed} / ${durationDays}${shouldExpire ? " (NOW EXPIRED)" : ""}`,
        )
      } catch (error) {
        console.error(`[v0] ❌ Error processing subscription ${subscription.id}:`, error)
        errorCount++
        continue
      }
    }

    const result = {
      message: `Updated ${updatedCount} subscriptions (${backfilledCount} backfilled)`,
      totalProcessed: userSubscriptions.length,
      updatedCount,
      backfilledCount,
      expiredCount: 0, // Not tracking new expirations separately
      alreadyExpiredCount,
      skippedDueToInactiveSubscription,
      errorCount,
    }

    console.log("[v0] 🎉 Update complete:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] ❌ CRITICAL ERROR in update-subscription-days:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  return POST(request)
}
