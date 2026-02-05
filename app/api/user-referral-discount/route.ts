import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseBrowserClient } from "@/lib/supabase"

// GET - Validate referral code for tickets (user enters code manually)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json({ success: false, error: "Missing code" }, { status: 400 })
    }

    const supabase = getSupabaseBrowserClient()

    // Check if referral code exists, is active, and applies to tickets
    const { data: referralData, error: referralError } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single()

    if (referralError || !referralData) {
      return NextResponse.json({ success: false, error: "Invalid referral code" })
    }

    // Check if code applies to tickets
    if (referralData.applies_to_tickets === false) {
      return NextResponse.json({ success: false, error: "This code does not apply to tickets" })
    }

    // Check if code is expired
    if (referralData.expires_at) {
      const expiryDate = new Date(referralData.expires_at)
      if (expiryDate < new Date()) {
        return NextResponse.json({ success: false, error: "Referral code expired" })
      }
    }

    // Check if usage limit reached
    if (referralData.usage_limit && referralData.times_used >= referralData.usage_limit) {
      return NextResponse.json({ success: false, error: "Referral code usage limit reached" })
    }

    return NextResponse.json({
      success: true,
      discount: {
        code: referralData.code,
        discount_percent: referralData.discount_percentage,
      },
    })
  } catch (error) {
    console.error("Error validating referral code:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// POST - Check referral discount for subscriptions (existing logic)
export async function POST(request: NextRequest) {
  try {
    const { userId, subscriptionId } = await request.json()

    console.log("[v0] Checking referral discount for userId:", userId, "subscriptionId:", subscriptionId)

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

    console.log("[v0] User data:", userData)
    console.log("[v0] User error:", userError)

    if (userError || !userData?.referral_code) {
      console.log("[v0] No referral code found for user")
      return NextResponse.json({ hasDiscount: false, discount: 0, reason: "no_code" })
    }

    console.log("[v0] User has referral code:", userData.referral_code)

    // Check if referral code exists and is valid for this subscription
    const { data: referralData, error: referralError } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("code", userData.referral_code)
      .eq("subscription_id", subscriptionId)
      .eq("is_active", true)
      .single()

    console.log("[v0] Referral data:", referralData)
    console.log("[v0] Referral error:", referralError)

    if (referralError || !referralData) {
      console.log("[v0] No matching referral code for this subscription")
      return NextResponse.json({ hasDiscount: false, discount: 0, reason: "no_match" })
    }

    // Check if code is expired
    if (referralData.expires_at) {
      const expiryDate = new Date(referralData.expires_at)
      if (expiryDate < new Date()) {
        console.log("[v0] Referral code expired")
        return NextResponse.json({ hasDiscount: false, discount: 0, reason: "expired" })
      }
    }

    // Check if usage limit reached
    if (referralData.usage_limit && referralData.times_used >= referralData.usage_limit) {
      console.log("[v0] Referral code usage limit reached")
      return NextResponse.json({ hasDiscount: false, discount: 0, reason: "limit_reached" })
    }

    console.log("[v0] Referral code valid! Discount:", referralData.discount_percentage)

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
