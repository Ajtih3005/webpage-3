import { type NextRequest, NextResponse } from "next/server"
import { getAISupabaseClient } from "@/lib/ai-supabase-server"

export const runtime = "nodejs"
export const maxDuration = 60
export const dynamic = "force-dynamic"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
}

export async function POST(request: NextRequest) {
  try {
    const { courseId, videoName, poses, isFirstChunk } = await request.json()

    if (!poses || poses.length === 0) {
      return NextResponse.json({ error: "No pose data provided" }, { status: 400 })
    }

    const aiSupabase = getAISupabaseClient()

    const posesArray = poses.map((pose: any) => ({
      timestamp: pose.timestamp || 0,
      landmarks: pose.landmarks,
      visibility: pose.visibility,
    }))

    if (isFirstChunk) {
      const { data: poseData, error: insertError } = await aiSupabase
        .from("instructor_poses")
        .insert({
          course_id: courseId || "temp_" + Date.now(),
          video_url: videoName,
          total_frames: poses.length,
          poses: posesArray,
        })
        .select()
        .single()

      if (insertError) throw insertError

      return NextResponse.json({
        sessionId: poseData.id,
        courseId: poseData.course_id,
        success: true,
      })
    } else {
      const { data: existingData, error: fetchError } = await aiSupabase
        .from("instructor_poses")
        .select("poses, total_frames")
        .eq("course_id", courseId)
        .single()

      if (fetchError) throw fetchError

      const updatedPoses = [...(existingData.poses || []), ...posesArray]

      const { data: updateData, error: updateError } = await aiSupabase
        .from("instructor_poses")
        .update({
          poses: updatedPoses,
          total_frames: updatedPoses.length,
        })
        .eq("course_id", courseId)
        .select()
        .single()

      if (updateError) throw updateError

      return NextResponse.json({
        sessionId: updateData.id,
        courseId: updateData.course_id,
        success: true,
      })
    }
  } catch (error: any) {
    console.error("[v0] Error saving pose session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { courseId, totalFrames } = await request.json()

    const aiSupabase = getAISupabaseClient()

    const { error } = await aiSupabase
      .from("instructor_poses")
      .update({
        total_frames: totalFrames,
      })
      .eq("course_id", courseId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error updating pose session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
