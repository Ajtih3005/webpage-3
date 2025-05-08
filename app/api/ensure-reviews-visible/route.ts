import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Initialize Supabase client with admin privileges
    const supabaseAdmin = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "")

    // Check if reviews table exists and has data
    const { data: reviewsData, error: reviewsError } = await supabaseAdmin
      .from("reviews")
      .select("count")
      .eq("is_published", true)

    if (reviewsError) {
      console.error("Error checking reviews table:", reviewsError)
      return NextResponse.json({ success: false, error: reviewsError.message }, { status: 500 })
    }

    // Check if we need to update any reviews to be published
    const { error: updateError } = await supabaseAdmin
      .from("reviews")
      .update({ is_published: true })
      .eq("is_published", false)

    if (updateError) {
      console.error("Error updating reviews:", updateError)
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    // Count how many reviews are now published
    const { count, error: countError } = await supabaseAdmin
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)

    if (countError) {
      console.error("Error counting published reviews:", countError)
      return NextResponse.json({ success: false, error: countError.message }, { status: 500 })
    }

    // Ensure we have some featured reviews (about 10% of total)
    const featuredCount = Math.max(3, Math.floor((count || 0) * 0.1))

    const { error: featuredError } = await supabaseAdmin
      .from("reviews")
      .update({ is_featured: true })
      .eq("is_published", true)
      .gte("rating", 4)
      .order("rating", { ascending: false })
      .limit(featuredCount)

    if (featuredError) {
      console.error("Error setting featured reviews:", featuredError)
      return NextResponse.json({ success: false, error: featuredError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${count} reviews are now visible on the homepage`,
      count,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
