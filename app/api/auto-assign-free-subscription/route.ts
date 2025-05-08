import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // First, get the numeric ID from the users table using the string user_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (userError) {
      console.error("Error fetching user:", userError)
      return NextResponse.json({ success: false, error: userError.message }, { status: 500 })
    }

    if (!userData) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const numericUserId = userData.id

    // Get the free subscription (price = 0 AND duration_days = 30)
    const { data: freeSubscriptions, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("price", 0)
      .eq("duration_days", 30)
      .eq("is_default_for_new_users", true)

    if (subscriptionError) {
      console.error("Error fetching free subscription:", subscriptionError)
      return NextResponse.json({ success: false, error: subscriptionError.message }, { status: 500 })
    }

    if (!freeSubscriptions || freeSubscriptions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No free 30-day subscription found. Please create one and mark it as default for new users.",
        },
        { status: 404 },
      )
    }

    // Process each free subscription (should be just one)
    const results = await Promise.all(
      freeSubscriptions.map(async (subscription) => {
        // For one-time subscriptions, check if user has already had this subscription
        if (subscription.is_one_time_only) {
          const { data: existingSubscription, error: checkError } = await supabase
            .from("user_subscriptions")
            .select("id")
            .eq("user_id", numericUserId)
            .eq("subscription_id", subscription.id)
            .maybeSingle()

          if (checkError) {
            console.error(`Error checking existing subscription ${subscription.id}:`, checkError)
            return {
              success: false,
              subscription_id: subscription.id,
              error: checkError.message,
            }
          }

          // If user already had this subscription, skip it
          if (existingSubscription) {
            return {
              success: true,
              subscription_id: subscription.id,
              message: "User already had this one-time subscription",
              skipped: true,
            }
          }
        } else {
          // For regular subscriptions, check if user already has an active subscription
          const { data: activeSubscription, error: activeError } = await supabase
            .from("user_subscriptions")
            .select("id")
            .eq("user_id", numericUserId)
            .eq("subscription_id", subscription.id)
            .eq("is_active", true)
            .maybeSingle()

          if (activeError) {
            console.error(`Error checking active subscription ${subscription.id}:`, activeError)
            return {
              success: false,
              subscription_id: subscription.id,
              error: activeError.message,
            }
          }

          // If user already has this subscription active, skip it
          if (activeSubscription) {
            return {
              success: true,
              subscription_id: subscription.id,
              message: "User already has this subscription active",
              skipped: true,
            }
          }
        }

        // Calculate start and end dates - always 30 days from now
        const startDate = new Date()
        const endDate = new Date()
        endDate.setDate(startDate.getDate() + 30) // Always 30 days

        // Add user to subscription using the numeric ID
        const { error } = await supabase.from("user_subscriptions").insert({
          user_id: numericUserId,
          subscription_id: subscription.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: "active",
          is_active: true,
          is_one_time_subscription: subscription.is_one_time_only || false,
        })

        if (error) {
          console.error(`Error adding user to subscription ${subscription.id}:`, error)
          return {
            success: false,
            subscription_id: subscription.id,
            error: error.message,
          }
        }

        return {
          success: true,
          subscription_id: subscription.id,
          message: "User added to free 30-day subscription successfully",
        }
      }),
    )

    // Check if any subscriptions were successfully assigned
    const anySuccess = results.some((result) => result.success && !result.skipped)
    const allSkipped = results.every((result) => result.success && result.skipped)

    if (allSkipped) {
      return NextResponse.json({
        success: true,
        message: "User already has the free 30-day subscription",
        results,
      })
    }

    if (anySuccess) {
      return NextResponse.json({
        success: true,
        message: "User added to free 30-day subscription successfully",
        results,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to add user to free 30-day subscription",
          results,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error in auto-assign-free-subscription API:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
