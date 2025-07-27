import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, role } = await request.json()
    const sessionId = params.id

    const supabase = getSupabaseBrowserClient()

    // Check if session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from("live_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("status", "active")
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ success: false, error: "Session not found or inactive" }, { status: 404 })
    }

    // Add user to session participants
    const { error: participantError } = await supabase.from("session_participants").upsert({
      session_id: sessionId,
      user_id: userId,
      role: role,
      joined_at: new Date().toISOString(),
    })

    if (participantError) throw participantError

    return NextResponse.json({
      success: true,
      session,
      websocketUrl: `ws://localhost:8080`,
    })
  } catch (error) {
    console.error("Error joining session:", error)
    return NextResponse.json({ success: false, error: "Failed to join session" }, { status: 500 })
  }
}
