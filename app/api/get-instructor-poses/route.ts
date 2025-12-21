import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const aiSupabase = createClient(process.env.AI_SUPABASE_URL!, process.env.AI_SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
    }

    const { data: poses, error } = await aiSupabase
      .from("instructor_poses")
      .select("timestamp_ms, pose_landmarks, visibility_scores")
      .eq("session_id", sessionId)
      .order("timestamp_ms", { ascending: true })

    if (error) {
      console.error("[v0] ❌ Failed to fetch instructor poses:", error)
      return NextResponse.json({ error: "Failed to fetch poses" }, { status: 500 })
    }

    return NextResponse.json({ poses })
  } catch (error) {
    console.error("[v0] ❌ Error fetching instructor poses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
