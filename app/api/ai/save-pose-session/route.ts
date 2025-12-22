import { type NextRequest, NextResponse } from "next/server"
import { getAISupabaseClient } from "@/lib/ai-supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { videoName, videoDuration, poses, sessionId, isChunk, chunkIndex } = await request.json()

    const aiSupabase = getAISupabaseClient()

    if (isChunk && sessionId) {
      // This is a chunk of poses for an existing session
      const poseData = poses.map((pose: any) => ({
        session_id: sessionId,
        timestamp_ms: Math.round(pose.timestamp * 1000),
        pose_landmarks: {
          landmarks: pose.landmarks,
          visibility: pose.visibility,
        },
      }))

      const { error: posesError } = await aiSupabase.from("instructor_poses").insert(poseData)

      if (posesError) throw posesError

      return NextResponse.json({
        success: true,
        sessionId,
        chunkIndex,
        message: `Chunk ${chunkIndex} uploaded successfully`,
      })
    }

    // First chunk or small dataset - create session
    if (!poses || poses.length === 0) {
      return NextResponse.json({ error: "No pose data provided" }, { status: 400 })
    }

    // Create pose session
    const { data: session, error: sessionError } = await aiSupabase
      .from("pose_sessions")
      .insert({
        course_id: "temp_" + Date.now(),
        video_name: videoName,
        video_duration: videoDuration,
        total_frames: videoDuration * 2, // Approximate total frames (will be updated)
        processing_status: "processing",
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Insert first batch of pose landmarks
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

export async function PATCH(request: NextRequest) {
  try {
    const { sessionId, totalFrames } = await request.json()

    const aiSupabase = getAISupabaseClient()

    const { error } = await aiSupabase
      .from("pose_sessions")
      .update({
        total_frames: totalFrames,
        processing_status: "completed",
      })
      .eq("id", sessionId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating pose session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
