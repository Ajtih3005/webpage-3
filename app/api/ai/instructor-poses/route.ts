import { type NextRequest, NextResponse } from "next/server"
import { getAISupabaseClient } from "@/lib/ai-supabase-server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const courseId = searchParams.get("courseId")

    if (!courseId) {
      return NextResponse.json({ error: "Course ID required" }, { status: 400 })
    }

    const aiSupabase = getAISupabaseClient()

    const { data: poseData, error: dataError } = await aiSupabase
      .from("instructor_pose_data")
      .select("*")
      .eq("course_id", courseId)
      .single()

    if (dataError) throw dataError

    if (!poseData) {
      return NextResponse.json({ error: "No pose data found for this course" }, { status: 404 })
    }

    // Return poses array from JSONB column
    return NextResponse.json({
      poses: poseData.poses || [],
      session: {
        id: poseData.id,
        course_id: poseData.course_id,
        video_name: poseData.video_name,
        video_duration: poseData.video_duration,
        total_frames: poseData.total_frames,
      },
    })
  } catch (error: any) {
    console.error("Error fetching instructor poses:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
