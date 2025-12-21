import { type NextRequest, NextResponse } from "next/server"
import { getAISupabaseClient } from "@/lib/ai-supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { videoName, videoDuration, poses } = await request.json()

    if (!poses || poses.length === 0) {
      return NextResponse.json({ error: "No pose data provided" }, { status: 400 })
    }

    const aiSupabase = getAISupabaseClient()

    // Create pose session
    const { data: session, error: sessionError } = await aiSupabase
      .from("pose_sessions")
      .insert({
        course_id: "temp_" + Date.now(),
        video_name: videoName,
        video_duration: videoDuration,
        total_frames: poses.length,
        processing_status: "completed",
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Insert all pose landmarks
    const poseData = poses.map((pose: any) => ({
      session_id: session.id,
      timestamp_ms: Math.round(pose.timestamp * 1000),
      pose_landmarks: {
        landmarks: pose.landmarks,
        visibility: pose.visibility,
      },
    }))

    const { error: posesError } = await aiSupabase.from("instructor_poses").insert(poseData)

    if (posesError) throw posesError

    return NextResponse.json({ sessionId: session.id, success: true })
  } catch (error: any) {
    console.error("Error saving pose session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
