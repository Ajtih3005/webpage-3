import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { courseId, instructorId, sessionType } = await request.json()

    const supabase = getSupabaseBrowserClient()

    // Create session in database
    const { data: session, error } = await supabase
      .from("live_sessions")
      .insert({
        course_id: courseId,
        instructor_id: instructorId,
        session_type: sessionType,
        status: "active",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      session,
    })
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 })
  }
}
