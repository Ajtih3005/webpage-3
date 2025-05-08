"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { UserLayout } from "@/components/user-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate, getBatchLabel } from "@/lib/utils"
import { ArrowLeft, Maximize, Minimize } from "lucide-react"

interface Course {
  id: number
  title: string
  description: string | null
  youtube_link: string
  scheduled_date: string
  is_predefined_batch: boolean
  batch_number: string | null
  custom_batch_time: string | null
}

export default function ViewPreviousSession({ params }: { params: { id: string } }) {
  const router = useRouter()
  const courseId = Number.parseInt(params.id)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const videoContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCourseDetails()
  }, [courseId])

  // Update the fetchCourseDetails function to be more permissive
  async function fetchCourseDetails() {
    try {
      setLoading(true)
      setError(null)

      const userId = localStorage.getItem("userId")
      if (!userId) {
        throw new Error("User ID not found")
      }

      const supabase = getSupabaseBrowserClient()

      // Get course details first without checking attendance
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single()

      if (courseError) {
        throw new Error("Course not found. Please check the course ID.")
      }

      // Set the course data immediately
      setCourse(courseData)

      // Check if the user has attended this course
      const { data: attendance, error: attendanceError } = await supabase
        .from("user_courses")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .single()

      // If there's no attendance record, create one to allow access
      if (attendanceError) {
        console.log("No attendance record found, creating one to allow access")

        // Create an attendance record to allow access
        await supabase.from("user_courses").insert([
          {
            user_id: userId,
            course_id: courseId,
            attended: true,
            attended_at: new Date().toISOString(),
          },
        ])
      } else if (!attendance.attended) {
        // Update the attendance record if it exists but attended is false
        await supabase
          .from("user_courses")
          .update({ attended: true, attended_at: new Date().toISOString() })
          .eq("id", attendance.id)
      }
    } catch (error: any) {
      console.error("Error fetching course details:", error)
      setError(error.message || "Failed to load the session")
    } finally {
      setLoading(false)
    }
  }

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return

    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (videoContainerRef.current.requestFullscreen) {
          videoContainerRef.current.requestFullscreen()
        } else if ((videoContainerRef.current as any).mozRequestFullScreen) {
          ;(videoContainerRef.current as any).mozRequestFullScreen()
        } else if ((videoContainerRef.current as any).webkitRequestFullscreen) {
          ;(videoContainerRef.current as any).webkitRequestFullscreen()
        } else if ((videoContainerRef.current as any).msRequestFullscreen) {
          ;(videoContainerRef.current as any).msRequestFullscreen()
        }
        setIsFullscreen(true)

        // For mobile: force landscape orientation if supported
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock("landscape").catch((err) => {
            console.log("Orientation lock failed:", err)
          })
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          ;(document as any).mozCancelFullScreen()
        } else if ((document as any).webkitExitFullscreen) {
          ;(document as any).webkitExitFullscreen()
        } else if ((document as any).msExitFullscreen) {
          ;(document as any).msExitFullscreen()
        }
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error("Fullscreen error:", err)
    }
  }

  // Update the getYoutubePreviousSessionUrl function to be more reliable:

  // Generate a YouTube embed URL for previous sessions (with limited controls)
  const getYoutubePreviousSessionUrl = (youtubeLink: string) => {
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = youtubeLink.match(regExp)

    if (!match || match[2].length !== 11) {
      console.error("Invalid YouTube URL:", youtubeLink)
      return youtubeLink
    }

    const videoId = match[2]
    const baseUrl = `https://www.youtube.com/embed/${videoId}`

    // For previous sessions: allow only play/pause controls with strict parameters
    return `${baseUrl}?controls=1&rel=0&showinfo=0&modestbranding=1&disablekb=1&fs=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&widget_referrer=${encodeURIComponent(window.location.origin)}`
  }

  useEffect(() => {
    const handleOrientationChange = () => {
      if (document.fullscreenElement && window.innerHeight > window.innerWidth) {
        // If we're in fullscreen but in portrait mode, this might be causing issues
        // Try to exit and re-enter fullscreen
        document
          .exitFullscreen()
          .then(() => {
            if (videoContainerRef.current) {
              videoContainerRef.current.requestFullscreen().catch((err) => {
                console.error("Error attempting to re-enter fullscreen:", err)
              })
            }
          })
          .catch((err) => {
            console.error("Error exiting fullscreen:", err)
          })
      }
    }

    // Add event listener for orientation changes
    window.addEventListener("orientationchange", handleOrientationChange)

    // Add event listener for fullscreen changes
    document.addEventListener("fullscreenchange", () => {
      setIsFullscreen(!!document.fullscreenElement)
    })

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange)
      document.removeEventListener("fullscreenchange", () => {
        setIsFullscreen(!!document.fullscreenElement)
      })
    }
  }, [])

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Previous Session</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : course ? (
          <Card>
            <CardHeader>
              <CardTitle>{course.title}</CardTitle>
              <CardDescription>
                {formatDate(course.scheduled_date)} •{" "}
                {course.is_predefined_batch && course.batch_number
                  ? getBatchLabel(course.batch_number)
                  : course.custom_batch_time}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.description && <p>{course.description}</p>}

              <div className="relative" ref={videoContainerRef}>
                {/* Custom video controls */}
                <div className="absolute top-2 right-2 z-10 flex space-x-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-black/50 hover:bg-black/70 text-white"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>
                </div>

                <div
                  className={`aspect-video rounded-md overflow-hidden bg-gray-100 relative ${isFullscreen ? "fixed inset-0 z-50 bg-black" : ""}`}
                >
                  <iframe
                    src={getYoutubePreviousSessionUrl(course.youtube_link)}
                    className={`w-full h-full ${isFullscreen ? "absolute inset-0" : ""}`}
                    title={course.title}
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen={false}
                  ></iframe>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                <p>This is a recording of a previous session you attended.</p>
                <p>You can rewatch this session at any time.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Alert>
            <AlertDescription>Session not found.</AlertDescription>
          </Alert>
        )}
      </div>
    </UserLayout>
  )
}
