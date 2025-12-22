import { type NextRequest, NextResponse } from "next/server"
import { getAISupabaseClient } from "@/lib/ai-supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { courseId, videoName, videoDuration, poses } = await request.json()

    if (!poses || poses.length === 0) {
      return NextResponse.json({ error: "No pose data provided" }, { status: 400 })
    }

    const aiSupabase = getAISupabaseClient()

    // Format poses as array with timestamps
    const posesArray = poses.map((pose: any) => ({
      timestamp: Math.round(pose.timestamp * 1000),
      landmarks: pose.landmarks,
      visibility: pose.visibility,
    }))

    // Store all poses in a single row
    const { data: poseData, error: insertError } = await aiSupabase
      .from("instructor_poses")
      .upsert(
        {
          course_id: courseId || "temp_" + Date.now(),
          video_url: videoName,
          total_frames: poses.length,
          poses: posesArray,
        },
        { onConflict: "course_id" },
      )
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({
      sessionId: poseData.id,
      courseId: poseData.course_id,
      success: true,
    })
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
      .from("instructor_poses")
      .update({
        total_frames: totalFrames,
      })
      .eq("id", sessionId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating pose session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
