"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Maximize, Minimize, Video, VideoOff, LogOut, Camera, X } from "lucide-react"
import { toast } from "@/hooks/use-toast" // Assuming this is still needed for some toasts

// Declare global for YouTube API
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

interface CourseDetails {
  id: number
  title: string
  description: string | null
  youtube_link: string
  scheduled_date: string
  language: string
  batch_number: string | null
  custom_batch_time: string | null
  is_predefined_batch: boolean
  videoDuration?: number
  scheduling_type?: string
  subscription_day?: number | null
  subscription_week?: number | null
  batch_times?: string | null
}

export default function AccessCoursePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
  const courseId = params.courseId as string
  const skipCamera = searchParams.get("skipCamera") === "true"

  // State Management (Simplified from original)
  const [course, setCourse] = useState<CourseDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [showCameraPreview, setShowCameraPreview] = useState(false)
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false) // Added for camera permission flow
  const [watchTime, setWatchTime] = useState(0)
  const [attendanceMarked, setAttendanceMarked] = useState(false)
  const [actualVideoDuration, setActualVideoDuration] = useState<number | null>(null) // From original
  const [currentTimePosition, setCurrentTimePosition] = useState(0) // From original
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null) // From original
  const [sessionActive, setSessionActive] = useState(true) // From original
  const [showCameraPermission, setShowCameraPermission] = useState(true) // Declared for camera permission prompt

  // Refs
  const playerRef = useRef<any>(null) // YouTube player instance
  const videoContainerRef = useRef<HTMLDivElement>(null) // Main video container for fullscreen
  const cameraVideoRef = useRef<HTMLVideoElement>(null) // Reference for the camera feed video element
  const watchTimerRef = useRef<NodeJS.Timeout | null>(null) // Timer for tracking watch time

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Helper to extract YouTube video ID
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }
  }, [])

  // Effect to fetch course data and initialize player
  useEffect(() => {
    const fetchCourseAndInitialize = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to access courses.",
            variant: "destructive",
          })
          router.push("/user/login")
          return
        }

        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .single()

        if (courseError) throw courseError
        if (!courseData) throw new Error("Course not found")

        setCourse(courseData)

        // Set actual video duration from DB or default
        const duration = courseData.videoDuration || 86400
        setActualVideoDuration(duration)

        // Extract YouTube video ID and initialize player
        if (courseData.youtube_link) {
          const videoId = getYouTubeVideoId(courseData.youtube_link)
          if (videoId) {
            initializeYouTubePlayer(videoId, courseData.youtube_link)
          } else {
            setError("Invalid YouTube URL provided for this course.")
          }
        } else {
          setError("No YouTube link found for this course.")
        }

        setLoading(false)
        checkSessionStatus(courseData) // Initial session check
      } catch (err: any) {
        console.error("[AccessCoursePage] Error fetching course:", err)
        setError(err.message || "Failed to load course details.")
        setLoading(false)
        // Redirect if it's a critical error like course not found
        if (err.message === "Course not found") {
          setTimeout(() => router.push("/user/access-course"), 3000)
        }
      }
    }

    fetchCourseAndInitialize()

    // Cleanup for API ready listener
    return () => {
      if (window.onYouTubeIframeAPIReady) {
        delete window.onYouTubeIframeAPIReady
      }
    }
  }, [courseId])

  useEffect(() => {
    if (!skipCamera) {
      // Request camera permission when page loads
      const requestCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          setCameraPermissionGranted(true)
          setShowCameraPermission(false)

          // Optionally auto-enable camera
          if (cameraVideoRef.current) {
            cameraVideoRef.current.srcObject = stream
            setCameraEnabled(true)
            setShowCameraPreview(true)
          }
        } catch (error) {
          console.error("Camera permission denied on page load:", error)
          setCameraPermissionGranted(false)
          setShowCameraPermission(false)
        }
      }

      requestCamera()
    } else {
      // Skip camera entirely
      setCameraPermissionGranted(false)
      setShowCameraPermission(false)
    }
  }, [skipCamera])

  // Function to initialize YouTube player
  const initializeYouTubePlayer = (videoId: string, videoUrl: string) => {
    console.log("[AccessCoursePage] Initializing YouTube player with video ID:", videoId)

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        if (playerRef.current) {
          try {
            playerRef.current.destroy()
            playerRef.current = null
          } catch (error) {
            console.error("[AccessCoursePage] Error destroying existing player:", error)
          }
        }

        if (videoContainerRef.current) {
          videoContainerRef.current.innerHTML = ""
        }

        const playerDiv = document.createElement("div")
        playerDiv.id = "youtube-player"
        playerDiv.style.width = "100%"
        playerDiv.style.height = "100%"
        playerDiv.style.position = "absolute"
        playerDiv.style.top = "0"
        playerDiv.style.left = "0"
        playerDiv.style.zIndex = "1"

        if (videoContainerRef.current) {
          videoContainerRef.current.appendChild(playerDiv)
        } else {
          console.error("[AccessCoursePage] videoContainerRef is null")
          setError("Failed to initialize video player.")
          return
        }

        playerRef.current = new window.YT.Player("youtube-player", {
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 0, // Hide ALL on-screen controls
            disablekb: 1, // Disable keyboard controls
            fs: 0, // Hide fullscreen button
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            mute: 0,
            origin: window.location.origin,
            enablejsapi: 1,
            cc_load_policy: 0,
            color: "white",
            autohide: 1,
          },
          events: {
            onReady: (event: any) => {
              console.log("[AccessCoursePage] ✅ YouTube player ready!")

              const duration = event.target.getDuration()
              if (duration && duration > 0) {
                console.log("[AccessCoursePage] Video duration:", duration, "seconds")
                setActualVideoDuration(duration)
                setCourse((prev) => (prev ? { ...prev, videoDuration: duration } : null))
              }

              event.target.playVideo()
              event.target.setVolume(100)
              event.target.unMute()

              toast({
                title: "Video Ready",
                description: "Your session has started. Enjoy!",
              })

              startWatchTimer()

              setTimeout(() => {
                if (!attendanceMarked) {
                  markAttendance()
                }
              }, 60000)
            },
            onStateChange: (event: any) => {
              console.log("[AccessCoursePage] Player state:", event.data)

              if (event.data === 0) {
                handleVideoEnd()
              } else if (event.data === 100 || event.data === 101 || event.data === 150) {
                console.error("[AccessCoursePage] Video Error:", event.data)
                setError("This video cannot be played. Please contact support.")
                handleVideoEnd()
              }
            },
            onError: (event: any) => {
              console.error("[AccessCoursePage] ❌ YouTube error:", event.data)
              let errorMessage = "Error loading video."

              if (event.data === 2) errorMessage = "Invalid video parameter."
              else if (event.data === 5) errorMessage = "HTML5 player error."
              else if (event.data === 100) errorMessage = "Video not found."
              else if (event.data === 101 || event.data === 150) errorMessage = "Video cannot be embedded."

              toast({ title: "Video Error", description: errorMessage, variant: "destructive" })
              setError(errorMessage)
              handleVideoEnd()
            },
          },
        })
      } else {
        window.onYouTubeIframeAPIReady = initPlayer
      }
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }
  }

  // Function to check session status based on course details
  const checkSessionStatus = (currentCourseDetails: CourseDetails) => {
    if (!currentCourseDetails) return

    const now = new Date()
    const scheduledDate = new Date(currentCourseDetails.scheduled_date)

    // Default to 24 hours if no duration specified or if it's too short
    const videoDuration = actualVideoDuration || 86400

    let startHour = 0
    let startMinute = 0
    let sessionEndTime: Date | null = null

    if (currentCourseDetails.is_predefined_batch && currentCourseDetails.batch_number) {
      const batchNum = Number.parseInt(currentCourseDetails.batch_number)
      if (batchNum === 1) {
        startHour = 5
        startMinute = 30
      } else if (batchNum === 2) {
        startHour = 6
        startMinute = 40
      } else if (batchNum === 3) {
        startHour = 7
        startMinute = 50
      } else if (batchNum === 4) {
        startHour = 17
        startMinute = 30
      } else if (batchNum === 5) {
        startHour = 18
        startMinute = 40
      } else if (batchNum === 6) {
        startHour = 19
        startMinute = 50
      }
    } else if (currentCourseDetails.custom_batch_time) {
      const timeMatch = currentCourseDetails.custom_batch_time.match(/(\d+):(\d+)\s*(AM|PM)?/)
      if (timeMatch) {
        let hour = Number.parseInt(timeMatch[1])
        const minute = Number.parseInt(timeMatch[2])
        const ampm = timeMatch[3]?.toUpperCase()

        if (ampm === "PM" && hour < 12) hour += 12
        if (ampm === "AM" && hour === 12) hour = 0

        startHour = hour
        startMinute = minute
      }
    } else {
      // No specific batch time, treat as available all day for the scheduled date
      // This path should ideally not be taken if the backend enforces batch times
      // For safety, we can default to a standard start time or error out.
      // Let's assume it should have a batch time if scheduled_date is used meaningfully.
      console.warn(
        "[AccessCoursePage] Course has scheduled_date but no batch times specified. Assuming no session restriction beyond date.",
      )
      const todayLocalDate = now.toLocaleDateString("en-CA")
      const scheduledLocalDate = scheduledDate.toLocaleDateString("en-CA")
      if (scheduledLocalDate !== todayLocalDate) {
        setError("This course session is not for today. Returning to course list.")
        setSessionActive(false)
        setTimeout(() => router.push("/user/access-course"), 3000)
        return
      }
      // If today, allow access, but watch time will determine attendance
      setSessionActive(true) // Assume active if today
      // We might not be able to set a precise session start time here without batch times
      // So, we'll rely on video duration for session end.
      sessionEndTime = new Date(scheduledDate.getTime() + videoDuration * 1000)
    }

    if (!sessionEndTime) {
      scheduledDate.setHours(startHour, startMinute, 0, 0)
      setSessionStartTime(scheduledDate) // Store the session start time
      sessionEndTime = new Date(scheduledDate.getTime() + videoDuration * 1000)
    }

    const gracePeriod = 7200 // 2 hours grace period after video ends
    const sessionEndWithGrace = new Date(sessionEndTime.getTime() + gracePeriod * 1000)

    console.log("[AccessCoursePage] Session Check:")
    console.log("[AccessCoursePage] - Scheduled Start:", scheduledDate.toLocaleString())
    console.log("[AccessCoursePage] - Calculated End:", sessionEndTime.toLocaleString())
    console.log("[AccessCoursePage] - End with Grace:", sessionEndWithGrace.toLocaleString())
    console.log("[AccessCoursePage] - Current Time:", now.toLocaleString())

    const isActive = now >= scheduledDate && now < sessionEndWithGrace

    setSessionActive(isActive)

    if (now < scheduledDate) {
      // Session hasn't started yet
      toast({
        title: "Session Not Started",
        description: "This session hasn't started yet. Please wait for the scheduled time.",
        variant: "destructive",
      })
      setTimeout(() => {
        router.push("/user/access-course")
      }, 5000) // Wait longer to allow user to see message
    } else if (now > sessionEndWithGrace && !attendanceMarked) {
      // Session ended with grace period and video not completed/attendance not marked
      toast({
        title: "Session Ended",
        description: "This session is no longer active. Returning to course list.",
        variant: "destructive",
      })
      setTimeout(() => {
        router.push("/user/access-course")
      }, 5000)
    } else {
      console.log("[AccessCoursePage] Session is active and running normally.")
      // If active, calculate current time position for resuming video
      if (sessionStartTime) {
        const elapsedMilliseconds = now.getTime() - sessionStartTime.getTime()
        setCurrentTimePosition(Math.max(0, Math.floor(elapsedMilliseconds / 1000)))
      }
    }
  }

  // Start watch timer for attendance tracking
  const startWatchTimer = () => {
    console.log("[AccessCoursePage] Starting watch timer...")
    watchTimerRef.current = setInterval(() => {
      setWatchTime((prev) => {
        const newTime = prev + 1
        // Mark attendance after 60 seconds if not already marked and session is active
        if (newTime === 60 && !attendanceMarked && sessionActive) {
          markAttendance()
        }
        // Check session status periodically if it's still active
        if (newTime % 30 === 0) {
          // Check every 30 seconds
          checkSessionStatus(course!)
        }
        return newTime
      })
    }, 1000)
  }

  // Mark attendance
  const markAttendance = async () => {
    if (!course || !sessionActive) return // Don't mark if session inactive or no course data
    if (attendanceMarked) return // Don't mark again

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        console.error("[AccessCoursePage] User not logged in, cannot mark attendance.")
        return
      }

      const { error } = await supabase
        .from("user_courses")
        .upsert([
          // Use upsert to handle cases where attendance might already exist (e.g., partial session)
          {
            user_id: user.id,
            course_id: course.id,
            attended: true,
            attended_at: new Date().toISOString(),
            completed_video: false, // Ensure completed_video is false on initial attendance mark
          },
        ])
        .select() // Use select to get the inserted/updated row

      if (!error) {
        setAttendanceMarked(true)
        console.log("[AccessCoursePage] Attendance marked successfully.")
        toast({ title: "Attendance Recorded", description: "Your attendance has been successfully recorded." })
      } else {
        console.error("[AccessCoursePage] Error marking attendance:", error)
        setError("Failed to mark attendance. Please try again later.")
      }
    } catch (err) {
      console.error("[AccessCoursePage] Unexpected error marking attendance:", err)
      setError("An unexpected error occurred while marking attendance.")
    }
  }

  // Camera controls (improved handling)
  const toggleCamera = async () => {
    if (!cameraPermissionGranted) {
      toast({
        title: "Camera Permission Required",
        description: "Please allow camera access first.",
        variant: "destructive",
      })
      // Optionally prompt for permission here if not handled by CameraPermission component
      return
    }

    if (!cameraEnabled) {
      // Turn camera ON
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: "user",
          },
          audio: false, // Assuming audio is not needed for this feature
        })
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream
          setCameraEnabled(true)
          setCameraPermissionGranted(true) // Ensure it's true if we got here
          toast({ title: "Camera Started", description: "Your camera feed is active." })
        }
      } catch (err: any) {
        console.error("[AccessCoursePage] Error accessing camera:", err)
        setError("Could not access camera. Please check permissions or browser settings.")
        toast({ title: "Camera Error", description: "Failed to access camera.", variant: "destructive" })
        setCameraEnabled(false) // Ensure state is correct
      }
    } else {
      // Turn camera OFF
      if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
        const stream = cameraVideoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
        cameraVideoRef.current.srcObject = null
      }
      setCameraEnabled(false)
      setShowCameraPreview(false) // Hide preview when turning off camera
      toast({ title: "Camera Stopped", description: "Your camera feed has been turned off." })
    }
  }

  // Handle camera permission grant
  const handleCameraPermissionGranted = () => {
    setCameraPermissionGranted(true)
    setShowCameraPermission(false) // Hide the permission prompt
    // Optionally auto-enter fullscreen or start camera here
    // For now, we let user control fullscreen and camera start
  }

  // Handle skipping camera permission
  const handleSkipCamera = () => {
    setCameraPermissionGranted(false) // Explicitly state permission is NOT granted
    setShowCameraPermission(false)
    toast({ title: "Camera Skipped", description: "Camera feature will be unavailable." })
  }

  const toggleFullscreen = () => {
    const element = videoContainerRef.current
    if (!element) return

    if (!document.fullscreenElement) {
      if (element.requestFullscreen) {
        element.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`)
          toast({ title: "Fullscreen Error", description: "Unable to enter fullscreen mode.", variant: "destructive" })
        })
      } else if ((element as any).mozRequestFullScreen) {
        // Firefox
        ;(element as any).mozRequestFullScreen().catch(console.error)
      } else if ((element as any).webkitRequestFullscreen) {
        // Chrome, Safari and Opera
        ;(element as any).webkitRequestFullscreen().catch(console.error)
      } else if ((element as any).msRequestFullscreen) {
        // IE/Edge
        ;(element as any).msRequestFullscreen().catch(console.error)
      }
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        // Firefox
        ;(document as any).mozCancelFullScreen()
      } else if ((document as any).webkitExitFullscreen) {
        // Chrome, Safari and Opera
        ;(document as any).webkitExitFullscreen()
      } else if ((document as any).msExitFullscreen) {
        // IE/Edge
        ;(document as any).msExitFullscreen()
      }
      setIsFullscreen(false)
    }
  }

  const sendEmoji = (emoji: string) => {
    // Use a dedicated container for animations
    const container = document.getElementById("emoji-animation-container")
    if (container) {
      const emojiEl = document.createElement("div")
      emojiEl.textContent = emoji
      emojiEl.className = "absolute text-4xl animate-float-up"
      emojiEl.style.left = `${Math.random() * 80 + 10}%`
      emojiEl.style.bottom = "80px" // Adjusted positioning
      container.appendChild(emojiEl)
      setTimeout(() => emojiEl.remove(), 2000) // Remove after animation duration
    }
  }

  // Handle video end event
  const handleVideoEnd = async () => {
    console.log("[AccessCoursePage] 📹 Video ended - cleaning up...")
    if (watchTimerRef.current) {
      clearInterval(watchTimerRef.current)
    }

    // Mark video as completed IF attendance was already marked and user watched enough
    if (attendanceMarked && watchTime >= 60) {
      // Ensure they watched at least 60 seconds
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user && course) {
          const { error } = await supabase
            .from("user_courses")
            .update({ completed_video: true, completed_at: new Date().toISOString() })
            .eq("user_id", user.id)
            .eq("course_id", course.id)
          if (!error) {
            console.log("[AccessCoursePage] Video marked as completed.")
            toast({ title: "Video Completed", description: "You have successfully completed the video." })
          } else {
            console.error("[AccessCoursePage] Error marking video as completed:", error)
          }
        }
      } catch (err) {
        console.error("[AccessCoursePage] Error marking video as completed:", err)
      }
    } else if (!attendanceMarked && watchTime >= 60) {
      // If they watched enough but attendance wasn't marked (e.g., timer issue) try to mark attendance now
      markAttendance()
    }

    // Stop camera feed
    if (cameraEnabled && cameraVideoRef.current?.srcObject) {
      const stream = cameraVideoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      cameraVideoRef.current.srcObject = null
    }
    setCameraEnabled(false)
    setShowCameraPreview(false)

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error)
    }

    // Redirect back to course list after a delay
    setTimeout(() => {
      router.push("/user/access-course")
    }, 5000) // Wait longer to allow user to see message
  }

  const exitSession = () => {
    console.log("[AccessCoursePage] Exiting session...")
    if (watchTimerRef.current) {
      clearInterval(watchTimerRef.current)
    }
    if (playerRef.current) {
      try {
        playerRef.current.destroy()
      } catch (error) {
        console.error("[AccessCoursePage] Error destroying YouTube player on exit:", error)
      }
    }
    // Stop camera feed
    if (cameraEnabled && cameraVideoRef.current?.srcObject) {
      const stream = cameraVideoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      cameraVideoRef.current.srcObject = null
    }
    setCameraEnabled(false)
    setShowCameraPreview(false)

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error)
    }

    router.push("/user/dashboard")
  }

  useEffect(() => {
    // Add event listener for fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    // Prevent default behavior for certain keys if in fullscreen/video context
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        // Allow volume controls, but block others
        if (!(e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "F11")) {
          e.preventDefault()
          e.stopPropagation()
          return false
        }
      }
      // Handle specific keys for actions like exiting
      if (e.key === "Escape" && isFullscreen) {
        toggleFullscreen()
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        // Prevent accidental deletion/back
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }
    window.addEventListener("keydown", handleKeyDown, true)

    // Prevent right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }
    document.addEventListener("contextmenu", handleContextMenu)

    // Prevent selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault()
      return false
    }
    document.addEventListener("selectstart", handleSelectStart)

    // Prevent drag
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault()
      return false
    }
    document.addEventListener("dragstart", handleDragStart)

    // Prevent mouse wheel for zooming
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Wheel or Cmd+Wheel
        e.preventDefault()
        return false
      }
    }
    document.addEventListener("wheel", handleWheel, { passive: false })

    // Return cleanup function
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      window.removeEventListener("keydown", handleKeyDown, true)
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("selectstart", handleSelectStart)
      document.removeEventListener("dragstart", handleDragStart)
      document.removeEventListener("wheel", handleWheel)

      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current)
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (error) {
          console.error("[AccessCoursePage] Error destroying YouTube player on unmount:", error)
        }
      }
      // Stop camera feed on unmount
      if (cameraEnabled && cameraVideoRef.current?.srcObject) {
        const stream = cameraVideoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
        cameraVideoRef.current.srcObject = null
      }
      setCameraEnabled(false)
      setShowCameraPreview(false)

      // Exit fullscreen on unmount if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error)
      }
      // Remove API ready listener if it was set
      if (window.onYouTubeIframeAPIReady) {
        delete window.onYouTubeIframeAPIReady
      }
    }
  }, [isFullscreen, cameraEnabled]) // Re-run cleanup if state changes that affect listeners/actions

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading course...</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-4">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <Button onClick={() => router.push("/user/access-course")}>Back to Course List</Button>
      </div>
    )
  }

  // Main UI
  return (
    <div className="min-h-screen bg-black relative">
      {/* Hidden component for camera permission prompt */}
      {/* In this merge, we assume camera permission is handled by a separate component or flow,
          or it's implicitly granted/skipped if `showCameraPermission` is false.
          For simplicity in this merge, we'll integrate the camera logic directly. */}

      <div ref={videoContainerRef} className="relative w-full h-screen flex flex-col overflow-hidden">
        {/* LIVE Badge */}
        <div className="absolute top-4 left-4 z-30">
          <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            LIVE
          </div>
        </div>

        {/* Fullscreen Button */}
        <div className="absolute top-4 right-4 z-30">
          <Button
            onClick={toggleFullscreen}
            variant="ghost" // Use ghost for better integration with dark background
            size="icon"
            className="bg-black/50 border-white/20 hover:bg-white/20 text-white"
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </Button>
        </div>

        {/* YouTube Player Container - positioned absolutely to fill */}
        <div className="flex-1 relative bg-black">
          <div id="youtube-player" className="absolute inset-0 w-full h-full"></div>
        </div>

        {/* Camera Preview */}
        {cameraEnabled && showCameraPreview && (
          <div className="absolute bottom-24 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg z-20">
            <video
              ref={cameraVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              // Style to mirror the video like a selfie if desired, e.g. transform: scaleX(-1);
            />
            <button
              onClick={() => setShowCameraPreview(false)}
              className="absolute top-1 right-1 bg-black/50 hover:bg-red-600 text-white rounded-full p-1 transition-colors z-10"
              aria-label="Close Camera Preview"
            >
              <X className="h-3 w-3" />
            </button>
            {/* Camera Status Indicator - if camera is ON */}
            <div className="absolute top-1 left-1 bg-green-600/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center z-10">
              <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse"></div>
              LIVE
            </div>
          </div>
        )}

        {/* Emoji Animation Container */}
        <div id="emoji-animation-container" className="absolute inset-0 pointer-events-none z-10"></div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4 z-20">
          <div className="text-white text-lg font-semibold mb-3">{course?.title}</div>

          {/* Error Message Display */}
          {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
          {/* Session Status Message */}
          {!sessionActive && <div className="text-orange-400 text-sm mb-2">Session is currently inactive.</div>}
          {attendanceMarked && watchTime >= 60 && (
            <div className="text-green-400 text-sm mb-2">✓ Attendance marked & Video progress recorded.</div>
          )}

          <div className="flex items-center justify-between gap-2">
            <Button onClick={exitSession} variant="destructive" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Exit Session
            </Button>

            <div className="flex items-center gap-2">
              {/* Camera Toggle Button */}
              <Button
                onClick={toggleCamera}
                variant="outline"
                size="icon"
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                aria-label={cameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
                disabled={!cameraPermissionGranted} // Disable if permission not granted
              >
                {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>

              {/* Show Camera Preview Button (only if camera is enabled) */}
              {cameraEnabled && (
                <Button
                  onClick={() => setShowCameraPreview(!showCameraPreview)}
                  variant="outline"
                  size="icon"
                  className={`text-white ${showCameraPreview ? "bg-blue-500/20 border-blue-500" : "bg-white/10 border-white/20"} hover:bg-white/20`}
                  aria-label={showCameraPreview ? "Hide Camera Preview" : "Show Camera Preview"}
                >
                  <Camera className="w-5 h-5" />
                </Button>
              )}

              {/* Emoji Reactions */}
              <div className="flex gap-1">
                {["👍", "❤️", "😊", "🔥", "👏"].map((emoji) => (
                  <Button
                    key={emoji}
                    onClick={() => sendEmoji(emoji)}
                    variant="ghost"
                    size="icon"
                    className="text-2xl hover:scale-125 transition-transform"
                    aria-label={`Send ${emoji} reaction`}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Watch Time and Attendance Status */}
          <div className="text-white/70 text-sm mt-3 flex justify-between items-center">
            <span>
              Watch time: {Math.floor(watchTime / 60)}:{(watchTime % 60).toString().padStart(2, "0")}
            </span>
            {!attendanceMarked && watchTime < 60 && !error && sessionActive && (
              <span>Marking attendance in {Math.max(0, 60 - watchTime)} seconds...</span>
            )}
            {attendanceMarked && watchTime >= 60 && <span className="text-green-400 ml-4">✓ Attendance marked</span>}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) scale(1.5);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up 2s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
