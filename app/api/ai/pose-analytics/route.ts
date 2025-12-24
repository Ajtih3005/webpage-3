import { type NextRequest, NextResponse } from "next/server"
import { getAISupabaseClient } from "@/lib/ai-supabase-server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") // "instructor-videos" | "user-performance" | "insights"

    const aiSupabase = getAISupabaseClient()

    if (type === "instructor-videos") {
      const { data, error } = await aiSupabase
        .from("instructor_poses")
        .select("id, course_id, total_frames, created_at")
        .order("created_at", { ascending: false })

      if (error) throw error
      return NextResponse.json({ data })
    }

    if (type === "user-performance") {
      const { data, error } = await aiSupabase
        .from("user_pose_tracking")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error
      return NextResponse.json({ data })
    }

    if (type === "insights") {
      const { data: sessions, error } = await aiSupabase.from("user_pose_tracking").select("*")

      if (error) throw error

      if (sessions && sessions.length > 0) {
        const avgAccuracy = sessions.reduce((sum, s) => sum + (s.overall_accuracy || 0), 0) / sessions.length
        const totalSessions = sessions.length
        const uniqueUsers = new Set(sessions.map((s) => s.user_email)).size

        // Calculate joint accuracies
        const jointData = sessions.reduce((acc, s) => {
          const joints = s.joint_accuracies || {}
          Object.entries(joints).forEach(([joint, accuracy]: [string, any]) => {
            if (!acc[joint]) acc[joint] = []
            acc[joint].push(accuracy)
          })
          return acc
        }, {} as any)

        const jointAccuracy = Object.entries(jointData).reduce((acc, [joint, values]: [string, any]) => {
          acc[joint] = values.reduce((sum: number, v: number) => sum + v, 0) / values.length
          return acc
        }, {} as any)

        return NextResponse.json({
          data: {
            avgAccuracy,
            totalSessions,
            uniqueUsers,
            jointAccuracy,
          },
        })
      }

      return NextResponse.json({ data: null })
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
  } catch (error: any) {
    console.error("Error fetching pose analytics:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    const aiSupabase = getAISupabaseClient()

    const { error } = await aiSupabase.from("instructor_poses").delete().eq("id", sessionId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting pose session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
