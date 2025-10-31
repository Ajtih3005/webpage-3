"use server"

import { createClient } from "@supabase/supabase-js"

// Server-side AI Supabase client (credentials not exposed to client)
const getAISupabaseClient = () => {
  const aiSupabaseUrl = process.env.AI_SUPABASE_URL
  const aiSupabaseKey = process.env.AI_SUPABASE_ANON_KEY

  if (!aiSupabaseUrl || !aiSupabaseKey) {
    throw new Error("AI Supabase credentials not configured on server")
  }

  return createClient(aiSupabaseUrl, aiSupabaseKey)
}

export async function startAISession(userId: number, courseId: number, activityType: string, userEmail: string) {
  try {
    const supabase = getAISupabaseClient()

    const { data, error } = await supabase
      .from("ai_analysis_sessions")
      .insert([
        {
          user_email: userEmail,
          course_id: courseId,
          activity_type: activityType,
          session_start_time: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error

    return { success: true, sessionId: data.id }
  } catch (error: any) {
    console.error("[Server] Error starting AI session:", error)
    return { success: false, error: error.message }
  }
}

export async function savePoseAnalysis(sessionId: number, analysisData: any) {
  try {
    const supabase = getAISupabaseClient()

    const { error } = await supabase.from("ai_pose_analysis").insert([
      {
        session_id: sessionId,
        ...analysisData,
      },
    ])

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error("[Server] Error saving pose analysis:", error)
    return { success: false, error: error.message }
  }
}

export async function endAISession(sessionId: number, totalDuration: number, overallScore: number, reportData: any) {
  try {
    const supabase = getAISupabaseClient()

    // Update session
    const { error: updateError } = await supabase
      .from("ai_analysis_sessions")
      .update({
        session_end_time: new Date().toISOString(),
        total_duration: totalDuration,
        overall_score: overallScore,
      })
      .eq("id", sessionId)

    if (updateError) throw updateError

    // Save report
    const { error: reportError } = await supabase.from("ai_session_reports").insert([
      {
        session_id: sessionId,
        report_data: reportData,
        strengths: reportData.strengths,
        improvements: reportData.improvements,
        recommendations: reportData.recommendations,
        progress_notes: reportData.progressNotes,
      },
    ])

    if (reportError) throw reportError

    return { success: true }
  } catch (error: any) {
    console.error("[Server] Error ending AI session:", error)
    return { success: false, error: error.message }
  }
}

export async function getAISessions(activityType?: string, daysAgo?: number) {
  try {
    const supabase = getAISupabaseClient()

    let query = supabase.from("ai_analysis_sessions").select("*").order("session_start_time", { ascending: false })

    if (activityType && activityType !== "all") {
      query = query.eq("activity_type", activityType)
    }

    if (daysAgo) {
      const dateThreshold = new Date()
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo)
      query = query.gte("session_start_time", dateThreshold.toISOString())
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, sessions: data || [] }
  } catch (error: any) {
    console.error("[Server] Error fetching AI sessions:", error)
    return { success: false, error: error.message, sessions: [] }
  }
}

export async function getAIStats(daysAgo?: number) {
  try {
    const supabase = getAISupabaseClient()

    let query = supabase.from("ai_analysis_sessions").select("*")

    if (daysAgo) {
      const dateThreshold = new Date()
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo)
      query = query.gte("session_start_time", dateThreshold.toISOString())
    }

    const { data: sessions, error } = await query

    if (error) throw error

    if (!sessions || sessions.length === 0) {
      return {
        success: true,
        stats: {
          totalSessions: 0,
          averageScore: 0,
          totalUsers: 0,
          popularActivity: "yoga",
        },
      }
    }

    const totalSessions = sessions.length
    const averageScore = sessions.reduce((sum, session) => sum + (session.overall_score || 0), 0) / totalSessions
    const uniqueUsers = new Set(sessions.map((session) => session.user_email)).size

    const activityCounts = sessions.reduce(
      (acc, session) => {
        acc[session.activity_type] = (acc[session.activity_type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const popularActivity = Object.entries(activityCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "yoga"

    return {
      success: true,
      stats: {
        totalSessions,
        averageScore: Math.round(averageScore),
        totalUsers: uniqueUsers,
        popularActivity,
      },
    }
  } catch (error: any) {
    console.error("[Server] Error fetching AI stats:", error)
    return { success: false, error: error.message }
  }
}
