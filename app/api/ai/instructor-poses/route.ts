import { type NextRequest, NextResponse } from "next/server"
import { getAISupabaseClient } from "@/lib/ai-supabase-server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const aiSupabase = getAISupabaseClient()

    // Get instructor poses
    const { data: poses, error: posesError } = await aiSupabase
      .from("instructor_poses")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp_ms", { ascending: true })

    if (posesError) throw posesError

    // Get session info
    const { data: session, error: sessionError } = await aiSupabase
      .from("pose_sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (sessionError) throw sessionError

    return NextResponse.json({ poses, session })
  } catch (error: any) {
    console.error("Error fetching instructor poses:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
