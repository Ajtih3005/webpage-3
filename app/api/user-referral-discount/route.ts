import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, subscriptionId } = await request.json()

    if (!userId || !subscriptionId) {
      return NextResponse.json({ error: "Missing userId or subscriptionId" }, { status: 400 })
    }

    const supabase = getSupabaseBrowserClient()

    // Get user's referral code
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("referral_code")
      .eq("id", userId)
      .single()

    if (userError || !userData?.referral_code) {
      return NextResponse.json({ hasDiscount: false, discount: 0 })
    }

    // Check if referral code exists and is valid for this subscription
    const { data: referralData, error: referralError } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("code", userData.referral_code)
      .eq("subscription_id", subscriptionId)
      .eq("is_active", true)
      .single()

    if (referralError || !referralData) {
      return NextResponse.json({ hasDiscount: false, discount: 0 })
    }

    // Check if code is expired
    if (referralData.expires_at) {
      const expiryDate = new Date(referralData.expires_at)
      if (expiryDate < new Date()) {
        return NextResponse.json({ hasDiscount: false, discount: 0, reason: "expired" })
      }
    }

    // Check if usage limit reached
    if (referralData.usage_limit && referralData.times_used >= referralData.usage_limit) {
      return NextResponse.json({ hasDiscount: false, discount: 0, reason: "limit_reached" })
    }

    return NextResponse.json({
      hasDiscount: true,
      discount: referralData.discount_percentage,
      code: referralData.code,
    })
  } catch (error) {
    console.error("[v0] Error fetching referral discount:", error)
    return NextResponse.json({ error: "Internal server error", hasDiscount: false, discount: 0 }, { status: 500 })
  }
}
