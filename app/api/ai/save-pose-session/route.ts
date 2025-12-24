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
    const { courseId, videoName, poses, isFirstChunk, currentFrameNumber } = await request.json()

    if (!poses || poses.length === 0) {
      return NextResponse.json({ error: "No pose data provided" }, { status: 400 })
    }

    const aiSupabase = getAISupabaseClient()

    const posesArray = poses.map((pose: any) => ({
      timestamp: pose.timestamp || 0,
      landmarks: pose.landmarks,
    }))

    if (isFirstChunk) {
      const { data: poseData, error: insertError } = await aiSupabase
        .from("instructor_poses")
        .insert({
          course_id: courseId || "temp_" + Date.now(),
          video_url: videoName,
          total_frames: 0,
          poses_chunk_1: "[]",
          poses_chunk_2: "[]",
          poses_chunk_3: "[]",
          poses_chunk_4: "[]",
          poses_chunk_5: "[]",
        })
        .select()
        .single()

      if (insertError) throw insertError

      const { error: appendError } = await aiSupabase.rpc("append_to_pose_chunk", {
        p_course_id: poseData.course_id,
        p_new_poses: posesArray,
        p_chunk_number: 1,
      })

      if (appendError) {
        console.warn("[v0] RPC function not available, using fallback")
        // Fallback: direct update
        const { error: fallbackError } = await aiSupabase
          .from("instructor_poses")
          .update({
            poses_chunk_1: posesArray,
            total_frames: poses.length,
          })
          .eq("course_id", poseData.course_id)

        if (fallbackError) throw fallbackError
      }

      return NextResponse.json({
        sessionId: poseData.id,
        courseId: poseData.course_id,
        success: true,
      })
    } else {
      // Each chunk holds 1000 frames
      const chunkNumber = Math.min(Math.floor((currentFrameNumber || 0) / 1000) + 1, 5)

      console.log(`[v0] Appending to chunk ${chunkNumber} for frame ${currentFrameNumber}`)

      const { error: rpcError } = await aiSupabase.rpc("append_to_pose_chunk", {
        p_course_id: courseId,
        p_new_poses: posesArray,
        p_chunk_number: chunkNumber,
      })

      if (rpcError) {
        console.warn("[v0] RPC function not available, using fallback for chunk", chunkNumber)

        // Fallback: fetch existing chunk, append, and update
        const chunkColumn = `poses_chunk_${chunkNumber}`
        const { data: existingData, error: fetchError } = await aiSupabase
          .from("instructor_poses")
          .select(`${chunkColumn}, total_frames`)
          .eq("course_id", courseId)
          .single()

        if (fetchError) throw fetchError

        const existingChunk = existingData[chunkColumn] || []
        const updatedChunk = [...existingChunk, ...posesArray]

        const { error: fallbackError } = await aiSupabase
          .from("instructor_poses")
          .update({
            [chunkColumn]: updatedChunk,
            total_frames: (existingData.total_frames || 0) + poses.length,
          })
          .eq("course_id", courseId)

        if (fallbackError) throw fallbackError
      }

      return NextResponse.json({
        success: true,
        courseId: courseId,
        chunkNumber: chunkNumber,
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
