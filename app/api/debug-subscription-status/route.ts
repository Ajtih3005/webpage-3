import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    // Get sample user subscriptions with detailed status
    const { data: subscriptions, error } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        user_id,
        subscription_id,
        is_active,
        activation_date,
        total_active_days_used,
        subscriptions (
          name,
          duration_days
        ),
        users (
          name,
          email
        )
      `)
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate status for each subscription
    const subscriptionsWithStatus = subscriptions.map((sub) => {
      const totalDaysUsed = sub.total_active_days_used || 0
      const durationDays = sub.subscriptions?.duration_days || 30

      let calculatedStatus = "UNKNOWN"
      if (!sub.activation_date) {
        calculatedStatus = "PENDING"
      } else if (totalDaysUsed >= durationDays) {
        calculatedStatus = "EXPIRED"
      } else if (sub.is_active === false) {
        calculatedStatus = "PAUSED"
      } else {
        calculatedStatus = "ACTIVE"
      }

      return {
        ...sub,
        calculated_status: calculatedStatus,
        remaining_days: Math.max(0, durationDays - totalDaysUsed),
        days_used: totalDaysUsed,
        total_days: durationDays,
      }
    })

    return NextResponse.json({
      success: true,
      subscriptions: subscriptionsWithStatus,
      summary: {
        total: subscriptionsWithStatus.length,
        active: subscriptionsWithStatus.filter((s) => s.calculated_status === "ACTIVE").length,
        pending: subscriptionsWithStatus.filter((s) => s.calculated_status === "PENDING").length,
        paused: subscriptionsWithStatus.filter((s) => s.calculated_status === "PAUSED").length,
        expired: subscriptionsWithStatus.filter((s) => s.calculated_status === "EXPIRED").length,
      },
    })
  } catch (error) {
    console.error("Debug subscription status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
