"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import SynchronizedVideoPlayer from "@/components/synchronized-video-player"
import { Loader2 } from "lucide-react"

interface CourseDetails {
  id: number
  title: string
  description: string | null
  youtube_link: string
  session_mode: string
  allow_chat: boolean
}

export default function SynchronizedCoursePage({ params }: { params: { courseId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState<string>("")
  const [role, setRole] = useState<"instructor" | "student">("student")

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId")
    const storedUsername = localStorage.getItem("username") || "Anonymous"

    if (!storedUserId) {
      router.push("/user/login")
      return
    }

    setUserId(storedUserId)
    setUsername(storedUsername)

    fetchCourseAndCreateSession()
  }, [params.courseId])

  const fetchCourseAndCreateSession = async () => {
    try {
      const supabase = getSupabaseBrowserClient()

      // Fetch course details
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", params.courseId)
        .single()

      if (courseError) throw courseError

      setCourseDetails(course)

      // Check if user is instructor
      const userId = localStorage.getItem("userId")
      const isInstructor = course.instructor_id?.toString() === userId
      setRole(isInstructor ? "instructor" : "student")

      // Create or join session
      if (isInstructor) {
        // Create new session
        const { data: sessionData, error: sessionError } = await supabase
          .from("live_sessions")
          .insert({
            course_id: course.id,
            instructor_id: userId,
            session_type: "synchronized",
            status: "active",
          })
          .select()
          .single()

        if (sessionError) throw sessionError
        setSessionId(sessionData.id.toString())
      } else {
        // Find active session for this course
        const { data: sessions, error: sessionError } = await supabase
          .from("live_sessions")
          .select("id")
          .eq("course_id", course.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)

        if (sessionError) throw sessionError

        if (sessions && sessions.length > 0) {
          setSessionId(sessions[0].id.toString())
        } else {
          // No active session found
          throw new Error("No active session found for this course")
        }
      }
    } catch (error) {
      console.error("Error setting up synchronized session:", error)
      // Fallback to individual mode
      router.push(`/user/access-course/${params.courseId}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Setting up synchronized session...</p>
        </div>
      </div>
    )
  }

  if (!courseDetails || !sessionId || !userId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <h2 className="text-xl font-bold mb-4">Session Error</h2>
          <p className="mb-4">Unable to set up synchronized session</p>
          <button
            onClick={() => router.push("/user/access-course")}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    )
  }

  return (
    <SynchronizedVideoPlayer
      courseId={params.courseId}
      sessionId={sessionId}
      userId={userId}
      username={username}
      role={role}
      youtubeUrl={courseDetails.youtube_link}
      courseTitle={courseDetails.title}
    />
  )
}
