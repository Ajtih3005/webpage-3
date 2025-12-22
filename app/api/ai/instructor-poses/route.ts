import { type NextRequest, NextResponse } from "next/server"
import { getAISupabaseClient } from "@/lib/ai-supabase-server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get("sessionId")
    const courseId = searchParams.get("courseId")

    if (!sessionId && !courseId) {
      return NextResponse.json({ error: "Session ID or Course ID required" }, { status: 400 })
    }

    const aiSupabase = getAISupabaseClient()

    let query = aiSupabase.from("instructor_poses").select("*")

    if (sessionId) {
      query = query.eq("id", sessionId)
    } else if (courseId) {
      query = query.eq("course_id", courseId)
    }

    const { data: session, error: dataError } = await query.single()

    if (dataError) throw dataError

    if (!session) {
      return NextResponse.json({ error: "No pose data found" }, { status: 404 })
    }

    // Extract poses from JSONB array and format for compatibility
    const poses = (session.poses || []).map((pose: any) => ({
      timestamp_ms: pose.timestamp,
      pose_landmarks: pose.landmarks,
      visibility_scores: pose.visibility,
    }))

    // Return poses array from JSONB column
    return NextResponse.json({
      poses,
      session: {
        id: session.id,
        course_id: session.course_id,
        video_url: session.video_url,
        total_frames: session.total_frames,
        processed_at: session.processed_at,
      },
    })
  } catch (error: any) {
    console.error("Error fetching instructor poses:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
