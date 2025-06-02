"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { extractYoutubeVideoId } from "@/lib/utils"
import { Loader2, ArrowLeft, Lock, Camera, X, Video, VideoOff } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import CameraPermission from "./camera-permission"

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
}

export default function VideoPlayer({ params }: { params: { courseId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showCameraPermission, setShowCameraPermission] = useState(true)
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false)
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [userDbId, setUserDbId] = useState<number | null>(null)
  const [youtubeVideoId, setYoutubeVideoId] = useState<string>("")
  const [ytApiLoaded, setYtApiLoaded] = useState(false)
  const [hasCompletedVideo, setHasCompletedVideo] = useState(false)
  const [markingAttendance, setMarkingAttendance] = useState(false)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const [sessionActive, setSessionActive] = useState(true)
  const [actualVideoDuration, setActualVideoDuration] = useState<number | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [currentTimePosition, setCurrentTimePosition] = useState(0)
  const [fullscreenBlocked, setFullscreenBlocked] = useState(false)
  const [fullscreenAttempts, setFullscreenAttempts] = useState(0)
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false)

  // Camera states
  const [showCameraPreview, setShowCameraPreview] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const youtubePlayer = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement | null>(null)
  const videoTimer = useRef<NodeJS.Timeout | null>(null)
  const startVideoTimeout = useRef<NodeJS.Timeout | null>(null)
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const fullscreenCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const fullscreenRetryTimeout = useRef<NodeJS.Timeout | null>(null)
  const isMounted = useRef(true)
  const videoWrapperRef = useRef<HTMLDivElement | null>(null)
  const fullscreenOverlayRef = useRef<HTMLDivElement | null>(null)
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null)

  // ENHANCED Camera functions
  const startCamera = async () => {
    if (!cameraPermissionGranted) {
      toast({
        title: "Camera Permission Required",
        description: "Please refresh and allow camera access first.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("🎥 Starting camera...")

      // Stop any existing stream first
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320, max: 640 },
          height: { ideal: 240, max: 480 },
          facingMode: "user",
          frameRate: { ideal: 30 },
        },
        audio: false,
      })

      console.log("🎥 Camera stream obtained:", stream)
      console.log("🎥 Stream tracks:", stream.getTracks())

      setCameraStream(stream)
      setCameraOn(true)
      setCameraError(null)

      // IMPROVED: Set video stream with immediate connection
      if (cameraVideoRef.current) {
        console.log("🎥 Connecting stream to video element...")

        // Clear any existing source
        cameraVideoRef.current.srcObject = null

        // Set new stream
        cameraVideoRef.current.srcObject = stream

        // Force immediate play
        try {
          await cameraVideoRef.current.play()
          console.log("🎥 Video playing successfully")
        } catch (playError) {
          console.error("🎥 Play error:", playError)
          // Try again after a short delay
          setTimeout(async () => {
            try {
              if (cameraVideoRef.current) {
                await cameraVideoRef.current.play()
                console.log("🎥 Video playing on retry")
              }
            } catch (retryError) {
              console.error("🎥 Retry play error:", retryError)
            }
          }, 100)
        }
      }

      toast({
        title: "Camera Started",
        description: "Your camera is now active.",
      })
    } catch (error) {
      console.error("❌ Error accessing camera:", error)
      setCameraError("Camera access failed")
      setCameraOn(false)
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    console.log("🎥 FORCE STOPPING camera...")

    // Stop all tracks
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        console.log("🎥 Stopping track:", track.kind, track.label)
        track.stop()
      })
      setCameraStream(null)
    }

    // Clear video element
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null
      cameraVideoRef.current.pause()
      cameraVideoRef.current.load() // Force reload to clear
    }

    // Reset all states
    setCameraOn(false)
    setShowCameraPreview(false)
    setCameraError(null)

    console.log("🎥 Camera COMPLETELY stopped")
    toast({
      title: "Camera Stopped",
      description: "Your camera has been turned off.",
    })
  }

  const toggleCameraPreview = () => {
    if (!cameraOn) {
      toast({
        title: "Camera Not Active",
        description: "Please turn on the camera first.",
        variant: "destructive",
      })
      return
    }
    console.log("🎥 Toggling camera preview:", !showCameraPreview)
    setShowCameraPreview(!showCameraPreview)
  }

  const toggleCamera = () => {
    if (cameraOn) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  // Handle camera permission
  const handleCameraPermissionGranted = () => {
    console.log("🎥 Camera permission granted")
    setCameraPermissionGranted(true)
    setShowCameraPermission(false)
  }

  const handleSkipCamera = () => {
    console.log("🎥 Camera permission skipped")
    setCameraPermissionGranted(false)
    setShowCameraPermission(false)
  }

  // Function to request fullscreen with all possible methods
  const requestFullscreen = (element: HTMLElement) => {
    if (element.requestFullscreen) {
      element.requestFullscreen().catch((err) => console.error("Error attempting to enable fullscreen:", err))
    } else if ((element as any).mozRequestFullScreen) {
      ;(element as any)
        .mozRequestFullScreen()
        .catch((err) => console.error("Error attempting to enable fullscreen:", err))
    } else if ((element as any).webkitRequestFullscreen) {
      ;(element as any)
        .webkitRequestFullscreen()
        .catch((err) => console.error("Error attempting to enable fullscreen:", err))
    } else if ((element as any).msRequestFullscreen) {
      ;(element as any)
        .msRequestFullscreen()
        .catch((err) => console.error("Error attempting to enable fullscreen:", err))
    }
  }

  // Function to check if browser is in fullscreen mode
  const isInFullscreen = () => {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    )
  }

  // Function to enforce fullscreen
  const enforceFullscreen = () => {
    if (!isInFullscreen()) {
      setIsFullscreen(false)
      setShowFullscreenWarning(true)

      // Increment attempt counter
      setFullscreenAttempts((prev) => {
        const newCount = prev + 1

        // If too many attempts, block fullscreen and redirect
        if (newCount > 5) {
          setFullscreenBlocked(true)
          // FORCE Stop camera when session is terminated
          stopCamera()
          toast({
            title: "Session Terminated",
            description: "Too many fullscreen exits detected. Session has been terminated.",
            variant: "destructive",
          })

          // Redirect after a short delay
          setTimeout(() => {
            router.push("/user/access-course")
          }, 3000)
          return newCount
        }

        return newCount
      })

      // Try to re-enter fullscreen after a short delay
      if (fullscreenRetryTimeout.current) {
        clearTimeout(fullscreenRetryTimeout.current)
      }

      fullscreenRetryTimeout.current = setTimeout(() => {
        if (document.documentElement) {
          requestFullscreen(document.documentElement)
          setShowFullscreenWarning(false)
        }
      }, 1500)
    } else {
      setIsFullscreen(true)
      setShowFullscreenWarning(false)
    }
  }

  useEffect(() => {
    // Set mounted flag
    isMounted.current = true

    // Add class to body to prevent scrolling and selection
    document.body.classList.add("video-playing")

    // Add animation class for emoji reactions
    const style = document.createElement("style")
    style.textContent = `
      @keyframes floatUp {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-100px); opacity: 0; }
      }
      .animate-emoji {
        animation: floatUp 2s ease-out forwards;
      }
    `
    document.head.appendChild(style)

    // Only proceed if camera permission check is done
    if (!showCameraPermission) {
      // Add fullscreen change event listeners for all browser variants
      const handleFullscreenChange = () => {
        enforceFullscreen()
      }

      document.addEventListener("fullscreenchange", handleFullscreenChange)
      document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.addEventListener("mozfullscreenchange", handleFullscreenChange)
      document.addEventListener("MSFullscreenChange", handleFullscreenChange)

      // Start interval to continuously check fullscreen status
      fullscreenCheckInterval.current = setInterval(() => {
        enforceFullscreen()
      }, 1000)

      // Prevent keyboard shortcuts
      const handleKeyDown = (e: KeyboardEvent) => {
        // Allow only volume controls
        if (!(e.key === "ArrowUp" || e.key === "ArrowDown")) {
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

      // Prevent picture-in-picture
      const handlePictureInPicture = (e: Event) => {
        e.preventDefault()
        return false
      }

      document.addEventListener("enterpictureinpicture", handlePictureInPicture)

      // Prevent copying
      const handleCopy = (e: ClipboardEvent) => {
        e.preventDefault()
        return false
      }

      document.addEventListener("copy", handleCopy)

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
        if (e.ctrlKey) {
          e.preventDefault()
          return false
        }
      }

      document.addEventListener("wheel", handleWheel, { passive: false })

      // Hide cursor after inactivity
      let cursorTimeout: NodeJS.Timeout | null = null
      const handleMouseMove = () => {
        document.body.classList.remove("inactive-cursor")

        if (cursorTimeout) {
          clearTimeout(cursorTimeout)
        }

        cursorTimeout = setTimeout(() => {
          document.body.classList.add("inactive-cursor")
        }, 3000)
      }

      document.addEventListener("mousemove", handleMouseMove)

      // Initial cursor timeout
      cursorTimeout = setTimeout(() => {
        document.body.classList.add("inactive-cursor")
      }, 3000)

      fetchUserData()
      fetchCourseDetails()

      // Load YouTube API
      if (!window.YT) {
        const tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        const firstScriptTag = document.getElementsByTagName("script")[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

        // Define the onYouTubeIframeAPIReady function
        window.onYouTubeIframeAPIReady = () => {
          console.log("YouTube API ready")
          if (isMounted.current) {
            setYtApiLoaded(true)
          }
        }
      } else {
        setYtApiLoaded(true)
      }

      // Cleanup on unmount
      return () => {
        isMounted.current = false

        // FORCE Stop camera when component unmounts
        console.log("🎥 Component unmounting - FORCE stopping camera")
        stopCamera()

        // Remove body class
        document.body.classList.remove("video-playing")
        document.body.classList.remove("inactive-cursor")

        if (videoTimer.current) clearInterval(videoTimer.current)
        if (startVideoTimeout.current) clearTimeout(startVideoTimeout.current)
        if (sessionCheckInterval.current) clearInterval(sessionCheckInterval.current)
        if (fullscreenCheckInterval.current) clearInterval(fullscreenCheckInterval.current)
        if (fullscreenRetryTimeout.current) clearTimeout(fullscreenRetryTimeout.current)
        if (cursorTimeout) clearTimeout(cursorTimeout)

        // Exit fullscreen on unmount
        if (document.fullscreenElement) {
          document.exitFullscreen().catch((err) => console.error("Error exiting fullscreen:", err))
        } else if ((document as any).webkitExitFullscreen) {
          ;(document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          ;(document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          ;(document as any).msExitFullscreen()
        }

        // Remove event listeners
        document.removeEventListener("fullscreenchange", handleFullscreenChange)
        document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
        document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
        document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
        window.removeEventListener("keydown", handleKeyDown, true)
        document.removeEventListener("contextmenu", handleContextMenu)
        document.removeEventListener("enterpictureinpicture", handlePictureInPicture)
        document.removeEventListener("copy", handleCopy)
        document.removeEventListener("selectstart", handleSelectStart)
        document.removeEventListener("dragstart", handleDragStart)
        document.removeEventListener("wheel", handleWheel)
        document.removeEventListener("mousemove", handleMouseMove)

        // Destroy YouTube player if it exists
        if (youtubePlayer.current) {
          try {
            youtubePlayer.current.destroy()
          } catch (error) {
            console.error("Error destroying YouTube player:", error)
          }
        }

        // Remove the added style element
        const addedStyle = document.head.querySelector("style:last-child")
        if (addedStyle) {
          addedStyle.remove()
        }
      }
    }
  }, [params.courseId, router, showCameraPermission])

  // Effect to initialize YouTube player when API is loaded and video ID is set
  useEffect(() => {
    if (ytApiLoaded && youtubeVideoId && playerContainerRef.current && !showCameraPermission) {
      initializeYouTubePlayer()
    }
  }, [ytApiLoaded, youtubeVideoId, showCameraPermission])

  // Effect to check if session is still active
  useEffect(() => {
    if (courseDetails && !showCameraPermission) {
      // Start a timer to periodically check if the session is still active
      sessionCheckInterval.current = setInterval(() => {
        checkSessionStatus()
      }, 30000) // Check every 30 seconds

      // Initial check
      checkSessionStatus()

      return () => {
        if (sessionCheckInterval.current) {
          clearInterval(sessionCheckInterval.current)
        }
      }
    }
  }, [courseDetails, showCameraPermission])

  // Calculate the current time position in the video based on session start time
  const calculateCurrentTimePosition = (startTime: Date): number => {
    const now = new Date()
    const elapsedMilliseconds = now.getTime() - startTime.getTime()
    return Math.floor(elapsedMilliseconds / 1000) // Convert to seconds
  }

  // Check if the session is still active
  const checkSessionStatus = () => {
    if (!courseDetails) return

    const now = new Date()
    const scheduledDate = new Date(courseDetails.scheduled_date)

    // NEW LOGIC: Check if batch times are specified
    const hasBatchTimes = courseDetails.batch_number || courseDetails.custom_batch_time

    if (!hasBatchTimes) {
      // NO BATCH TIMES: Allow access for full day
      const todayLocalDate = now.toLocaleDateString("en-CA")
      const scheduledLocalDate = scheduledDate.toLocaleDateString("en-CA")

      if (scheduledLocalDate === todayLocalDate) {
        setSessionActive(true)
        return
      } else {
        setSessionActive(false)
        return
      }
    }

    // HAS BATCH TIMES: Use existing batch time logic
    let startHour = 0
    let startMinute = 0

    if (courseDetails.is_predefined_batch && courseDetails.batch_number) {
      // Parse predefined batch times
      const batchNum = Number.parseInt(courseDetails.batch_number)
      if (batchNum === 1) {
        startHour = 5
        startMinute = 30 // Morning Batch 1 (5:30 to 6:30)
      } else if (batchNum === 2) {
        startHour = 6
        startMinute = 40 // Morning Batch 2 (6:40 to 7:40)
      } else if (batchNum === 3) {
        startHour = 7
        startMinute = 50 // Morning Batch 3 (7:50 to 8:50)
      } else if (batchNum === 4) {
        startHour = 17
        startMinute = 30 // Evening Batch 4 (5:30 to 6:30)
      } else if (batchNum === 5) {
        startHour = 18
        startMinute = 40 // Evening Batch 5 (6:40 to 7:40)
      } else if (batchNum === 6) {
        startHour = 19
        startMinute = 50 // Evening Batch 6 (7:50 to 8:50)
      }
    } else if (courseDetails.custom_batch_time) {
      // Parse custom batch time
      const timeMatch = courseDetails.custom_batch_time.match(/(\d+):(\d+)\s*(AM|PM)?/)
      if (timeMatch) {
        let hour = Number.parseInt(timeMatch[1])
        const minute = Number.parseInt(timeMatch[2])
        const ampm = timeMatch[3]?.toUpperCase()

        // Convert to 24-hour format if needed
        if (ampm === "PM" && hour < 12) hour += 12
        if (ampm === "AM" && hour === 12) hour = 0

        startHour = hour
        startMinute = minute
      }
    }

    // Set the start time
    scheduledDate.setHours(startHour, startMinute, 0, 0)

    // Store the session start time
    if (!sessionStartTime) {
      setSessionStartTime(scheduledDate)
    }

    // Calculate end time based on actual video duration or default
    const duration = actualVideoDuration || courseDetails.videoDuration || 1800 // Use actual duration if available
    const endTime = new Date(scheduledDate.getTime() + duration * 1000)

    // Check if current time is within the session time
    const isActive = now >= scheduledDate && now < endTime

    // Update session active state
    setSessionActive(isActive)

    // If session is no longer active and video is not completed, redirect back
    if (!isActive && !hasCompletedVideo) {
      // FORCE Stop camera when session ends
      stopCamera()

      toast({
        title: "Session Ended",
        description: "This session is no longer active. Returning to course list.",
        variant: "destructive",
      })

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/user/access-course")
      }, 3000)
    }
  }

  // Fetch user data including database ID
  async function fetchUserData() {
    try {
      const supabase = getSupabaseBrowserClient()

      // Get auth user ID from localStorage
      const authUserId = localStorage.getItem("userId")
      if (!authUserId) {
        console.error("User ID not found in localStorage")
        setAttendanceError("User ID not found. Please log in again.")
        return
      }

      // Try to get user by user_id field first
      const { data, error } = await supabase.from("users").select("id, email").eq("user_id", authUserId).limit(1)

      if (error) {
        console.error("Error fetching user data:", error)
        setAttendanceError("Error fetching user data. Please try again.")
        return
      }

      if (data && data.length > 0) {
        setUserDbId(data[0].id)
      } else {
        // Try with id field as a fallback
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, email")
          .eq("id", authUserId)
          .limit(1)

        if (userError) {
          console.error("Error in second user fetch attempt:", userError)
          setAttendanceError("Error fetching user data. Please try again.")
          return
        }

        if (userData && userData.length > 0) {
          setUserDbId(userData[0].id)
        } else {
          // As a fallback, use the auth user ID directly
          setUserDbId(Number.parseInt(authUserId, 10) || null)

          if (isNaN(Number.parseInt(authUserId, 10))) {
            console.error("Auth user ID is not a valid number for fallback")
            setAttendanceError("User not found in database. Please contact support.")
          }
        }
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error)
      setAttendanceError("An unexpected error occurred. Please try again.")
    }
  }

  // Fetch course details
  async function fetchCourseDetails() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      // Fetch the course details
      const { data, error } = await supabase.from("courses").select("*").eq("id", params.courseId).single()

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error("Course not found")
      }

      // Set default video duration if not specified
      const videoDuration = data.video_duration || 1800 // 30 minutes by default

      setCourseDetails({
        ...data,
        videoDuration,
      })

      // Extract YouTube video ID
      const videoId = extractYoutubeVideoId(data.youtube_link)
      if (!videoId) {
        throw new Error("Invalid YouTube link")
      }

      setYoutubeVideoId(videoId)

      // Check if the session is active
      const now = new Date()
      const scheduledDate = new Date(data.scheduled_date)

      // NEW LOGIC: Check if batch times are specified
      const hasBatchTimes = data.batch_number || data.custom_batch_time

      if (!hasBatchTimes) {
        // NO BATCH TIMES: Allow access for full day
        const todayLocalDate = now.toLocaleDateString("en-CA")
        const scheduledLocalDate = scheduledDate.toLocaleDateString("en-CA")

        if (scheduledLocalDate === todayLocalDate) {
          setSessionActive(true)
        } else {
          toast({
            title: "Session Not Active",
            description: "This session is not currently active. Returning to course list.",
            variant: "destructive",
          })

          setTimeout(() => {
            router.push("/user/access-course")
          }, 3000)
        }
        return
      }

      // HAS BATCH TIMES: Use existing batch time logic
      let startHour = 0
      let startMinute = 0

      if (data.is_predefined_batch && data.batch_number) {
        // Parse predefined batch times
        const batchNum = Number.parseInt(data.batch_number)
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
      } else if (data.custom_batch_time) {
        // Parse custom batch time
        const timeMatch = data.custom_batch_time.match(/(\d+):(\d+)\s*(AM|PM)?/)
        if (timeMatch) {
          let hour = Number.parseInt(timeMatch[1])
          const minute = Number.parseInt(timeMatch[2])
          const ampm = timeMatch[3]?.toUpperCase()

          // Convert to 24-hour format if needed
          if (ampm === "PM" && hour < 12) hour += 12
          if (ampm === "AM" && hour === 12) hour = 0

          startHour = hour
          startMinute = minute
        }
      }

      // Set the start time
      scheduledDate.setHours(startHour, startMinute, 0, 0)

      // Store the session start time
      setSessionStartTime(scheduledDate)

      // Calculate the current time position in the video
      const currentPosition = calculateCurrentTimePosition(scheduledDate)
      setCurrentTimePosition(currentPosition)

      // Calculate end time based on default duration
      const endTime = new Date(scheduledDate.getTime() + videoDuration * 1000)

      // Check if current time is within the session time
      const isActive = now >= scheduledDate && now < endTime

      if (!isActive) {
        toast({
          title: "Session Not Active",
          description: "This session is not currently active. Returning to course list.",
          variant: "destructive",
        })

        // Redirect after a short delay
        setTimeout(() => {
          router.push("/user/access-course")
        }, 3000)
      }

      setSessionActive(isActive)
    } catch (error: any) {
      console.error("Error fetching course details:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load course details. Please try again later.",
        variant: "destructive",
      })
      router.push("/user/access-course")
    } finally {
      setLoading(false)
    }
  }

  // ENHANCED Function to initialize YouTube player
  const initializeYouTubePlayer = () => {
    if (!window.YT || !window.YT.Player || !playerContainerRef.current || !youtubeVideoId) {
      console.log("YouTube API or player container not ready")
      return
    }

    // Destroy existing player if it exists
    if (youtubePlayer.current) {
      try {
        youtubePlayer.current.destroy()
        youtubePlayer.current = null
      } catch (error) {
        console.error("Error destroying existing YouTube player:", error)
      }
    }

    try {
      // Create a new div for the player
      const playerDiv = document.createElement("div")
      playerDiv.id = "youtube-player"
      playerDiv.style.width = "100%"
      playerDiv.style.height = "100%"
      playerDiv.style.position = "absolute"
      playerDiv.style.top = "0"
      playerDiv.style.left = "0"

      // Clear the container first
      if (playerContainerRef.current) {
        playerContainerRef.current.innerHTML = ""
        playerContainerRef.current.appendChild(playerDiv)
      }

      console.log("🎬 Creating YouTube player with video ID:", youtubeVideoId)

      // Create new player with ENHANCED parameters
      youtubePlayer.current = new window.YT.Player("youtube-player", {
        videoId: youtubeVideoId,
        playerVars: {
          autoplay: 1, // Auto-play the video
          controls: 0, // Hide player controls
          disablekb: 1, // Disable keyboard controls
          fs: 0, // Hide fullscreen button
          rel: 0, // Don't show related videos
          showinfo: 0, // Hide video info
          iv_load_policy: 3, // Hide video annotations
          modestbranding: 1, // Hide YouTube logo
          cc_load_policy: 0, // TURN OFF CLOSED CAPTIONS
          playsinline: 1, // Play inline on mobile
          origin: window.location.origin,
          mute: 0, // Don't mute audio
          start: currentTimePosition > 0 ? currentTimePosition : 0,
          enablejsapi: 1, // Enable JavaScript API
          widget_referrer: window.location.origin,
        },
        events: {
          onReady: (event) => {
            console.log("🎬 YouTube player ready")

            // Set player size to fill container
            const iframe = event.target.getIframe()
            if (iframe) {
              iframe.style.width = "100vw"
              iframe.style.height = "100vh"
              iframe.style.position = "absolute"
              iframe.style.top = "0"
              iframe.style.left = "0"
              iframe.style.border = "none"
              iframe.style.pointerEvents = "none"

              // Add a transparent overlay to capture all events
              const overlay = document.createElement("div")
              overlay.style.position = "absolute"
              overlay.style.top = "0"
              overlay.style.left = "0"
              overlay.style.width = "100%"
              overlay.style.height = "100%"
              overlay.style.zIndex = "10"

              if (playerContainerRef.current) {
                playerContainerRef.current.appendChild(overlay)
              }
            }

            // Get the actual video duration from YouTube API
            const duration = event.target.getDuration()
            if (duration && duration > 0) {
              console.log("🎬 Actual video duration:", duration)
              setActualVideoDuration(duration)
            }

            // FORCE PLAY the video
            try {
              event.target.playVideo()
              console.log("🎬 Video play command sent")
            } catch (playError) {
              console.error("🎬 Error playing video:", playError)
            }

            // Set volume to 70%
            event.target.setVolume(70)

            // Start the video at the current position if joining late
            if (currentTimePosition > 0) {
              event.target.seekTo(currentTimePosition, true)
            }

            // Start video timer
            startVideoTimer()

            // Mark attendance after a delay
            startVideoTimeout.current = setTimeout(() => {
              markAttendance()
            }, 60000) // Mark attendance after 1 minute
          },
          onStateChange: (event) => {
            console.log("🎬 YouTube player state changed:", event.data)

            // YT.PlayerState.ENDED = 0
            if (event.data === 0) {
              console.log("🎬 Video ended")
              handleVideoEnd()
            }

            // YT.PlayerState.PLAYING = 1
            if (event.data === 1) {
              console.log("🎬 Video is playing")
            }

            // If video is paused, play it again (prevent user from pausing)
            if (event.data === 2) {
              console.log("🎬 Video paused - forcing play")
              setTimeout(() => {
                event.target.playVideo()
              }, 100)
            }

            // If video is buffering, show loading state
            if (event.data === 3) {
              console.log("🎬 Video is buffering...")
            }
          },
          onError: (event) => {
            console.error("🎬 YouTube player error:", event.data)
            toast({
              title: "Video Error",
              description: "There was an error playing the video. Please try again.",
              variant: "destructive",
            })
          },
          onPlaybackQualityChange: (event) => {
            console.log("🎬 Playback quality changed to:", event.data)
          },
          onPlaybackRateChange: (event) => {
            console.log("🎬 Playback rate changed to:", event.data)
            // If playback rate changes, reset it to 1
            if (event.data !== 1) {
              event.target.setPlaybackRate(1)
            }
          },
        },
      })
    } catch (error) {
      console.error("🎬 Error initializing YouTube player:", error)

      // Enhanced fallback to iframe
      if (playerContainerRef.current) {
        playerContainerRef.current.innerHTML = ""
        const iframe = document.createElement("iframe")

        // Add start parameter to start from current position if joining late
        const startParam = currentTimePosition > 0 ? `&start=${currentTimePosition}` : ""

        iframe.src = `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&controls=0&disablekb=1&fs=0&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&cc_load_policy=0&playsinline=1&mute=0${startParam}&origin=${encodeURIComponent(window.location.origin)}&enablejsapi=1`
        iframe.title = "YouTube video player"
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        iframe.allowFullscreen = true
        iframe.style.width = "100vw"
        iframe.style.height = "100vh"
        iframe.style.position = "absolute"
        iframe.style.top = "0"
        iframe.style.left = "0"
        iframe.style.border = "none"
        iframe.style.pointerEvents = "none"
        playerContainerRef.current.appendChild(iframe)

        // Add a transparent overlay to capture all events
        const overlay = document.createElement("div")
        overlay.style.position = "absolute"
        overlay.style.top = "0"
        overlay.style.left = "0"
        overlay.style.width = "100%"
        overlay.style.height = "100%"
        overlay.style.zIndex = "10"

        playerContainerRef.current.appendChild(overlay)

        // Start video timer
        startVideoTimer()

        // Mark attendance after a delay
        startVideoTimeout.current = setTimeout(() => {
          markAttendance()
        }, 60000) // Mark attendance after 1 minute
      }
    }
  }

  // Function to start the video timer
  const startVideoTimer = () => {
    console.log("⏱️ Starting video timer...")
    videoTimer.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)
  }

  // Function to handle video end
  const handleVideoEnd = async () => {
    console.log("🎬 Video ended")
    clearInterval(videoTimer.current!)
    setHasCompletedVideo(true)

    // Mark video as completed
    await markVideoCompleted()

    // FORCE Stop camera when video ends
    stopCamera()

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.error("Error exiting fullscreen:", err))
    } else if ((document as any).webkitExitFullscreen) {
      ;(document as any).webkitExitFullscreen()
    } else if ((document as any).mozCancelFullScreen) {
      ;(document as any).mozCancelFullScreen()
    } else if ((document as any).msExitFullscreen) {
      ;(document as any).msExitFullscreen()
    }

    // Redirect back to course list after a delay
    setTimeout(() => {
      router.push("/user/access-course")
    }, 3000)
  }

  // Function to mark attendance
  async function markAttendance() {
    if (!courseDetails || !userDbId) return

    setMarkingAttendance(true)
    setAttendanceError(null)

    try {
      const supabase = getSupabaseBrowserClient()

      // Check if attendance already marked
      const { data: existingAttendance, error: attendanceCheckError } = await supabase
        .from("user_courses")
        .select("*")
        .eq("user_id", userDbId)
        .eq("course_id", courseDetails.id)

      if (attendanceCheckError) {
        console.error("Error checking existing attendance:", attendanceCheckError)
        setAttendanceError("Error checking attendance. Please try again.")
        return
      }

      if (existingAttendance && existingAttendance.length > 0) {
        console.log("Attendance already marked for this course")
        return
      }

      // Mark attendance
      const { data, error } = await supabase
        .from("user_courses")
        .insert([
          {
            user_id: userDbId,
            course_id: courseDetails.id,
            attended: true,
          },
        ])
        .select()

      if (error) {
        console.error("Error marking attendance:", error)
        setAttendanceError("Error marking attendance. Please try again.")
        return
      }

      console.log("Attendance marked successfully:", data)
    } catch (error) {
      console.error("Error in markAttendance:", error)
      setAttendanceError("An unexpected error occurred. Please try again.")
    } finally {
      setMarkingAttendance(false)
    }
  }

  // Function to mark video as completed
  async function markVideoCompleted() {
    if (!courseDetails || !userDbId) return

    try {
      const supabase = getSupabaseBrowserClient()

      // Check if video completion already marked
      const { data: existingCompletion, error: completionCheckError } = await supabase
        .from("user_courses")
        .select("*")
        .eq("user_id", userDbId)
        .eq("course_id", courseDetails.id)

      if (completionCheckError) {
        console.error("Error checking existing completion:", completionCheckError)
        return
      }

      if (existingCompletion && existingCompletion.length > 0 && existingCompletion[0].completed_video) {
        console.log("Video completion already marked for this course")
        return
      }

      // Mark video as completed
      const { data, error } = await supabase
        .from("user_courses")
        .upsert([
          {
            user_id: userDbId,
            course_id: courseDetails.id,
            attended: true,
            completed_video: true,
          },
        ])
        .select()

      if (error) {
        console.error("Error marking video as completed:", error)
        return
      }

      console.log("Video marked as completed successfully:", data)
    } catch (error) {
      console.error("Error in markVideoCompleted:", error)
    }
  }

  // ENHANCED Handle exit click
  const handleExitClick = () => {
    console.log("🚪 Exit button clicked - FORCE stopping camera")

    // FORCE Stop camera when exiting
    stopCamera()

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.error("Error exiting fullscreen:", err))
    } else if ((document as any).webkitExitFullscreen) {
      ;(document as any).webkitExitFullscreen()
    } else if ((document as any).msExitFullscreen) {
      ;(document as any).msExitFullscreen()
    }

    router.push("/user/access-course")
  }

  // Show camera permission screen first
  if (showCameraPermission) {
    return <CameraPermission onPermissionGranted={handleCameraPermissionGranted} onSkip={handleSkipCamera} />
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading video session...</p>
        </div>
      </div>
    )
  }

  if (!sessionActive) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center p-6 bg-gray-800 rounded-lg max-w-md">
          <h2 className="text-white text-xl font-bold mb-4">Session Not Active</h2>
          <p className="text-gray-300 mb-6">This session is no longer active. Please return to the course list.</p>
          <Button onClick={handleExitClick}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
        </div>
      </div>
    )
  }

  if (fullscreenBlocked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center p-6 bg-gray-800 rounded-lg max-w-md">
          <h2 className="text-white text-xl font-bold mb-4">Session Terminated</h2>
          <p className="text-gray-300 mb-6">
            This session has been terminated due to multiple fullscreen exits. Please return to the course list.
          </p>
          <Button onClick={handleExitClick}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col w-screen h-screen overflow-hidden" ref={videoWrapperRef}>
      {/* Video Container */}
      <div
        className="absolute inset-0 w-screen h-screen flex items-center justify-center overflow-hidden"
        ref={playerContainerRef}
      ></div>

      {/* ENHANCED Camera Preview Window */}
      {showCameraPreview && cameraOn && (
        <div className="absolute top-4 right-4 z-50 bg-black rounded-lg border-2 border-green-500 overflow-hidden shadow-2xl">
          <div className="relative">
            <video
              ref={cameraVideoRef}
              autoPlay
              muted
              playsInline
              className="w-64 h-48 object-cover bg-gray-800"
              style={{
                transform: "scaleX(-1)",
                display: "block",
              }}
              onLoadedMetadata={() => {
                console.log("🎥 Camera video metadata loaded")
              }}
              onPlay={() => {
                console.log("🎥 Camera video started playing")
              }}
              onError={(e) => {
                console.error("🎥 Camera video error:", e)
              }}
            />
            <button
              onClick={() => {
                console.log("🎥 Closing camera preview")
                setShowCameraPreview(false)
              }}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              Local Preview Only
            </div>
            <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
              LIVE
            </div>
          </div>
        </div>
      )}

      {/* LIVE Indicator */}
      <div className="absolute top-2 left-2 z-50 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center">
        <span className="animate-pulse mr-1 h-2 w-2 rounded-full bg-white inline-block"></span>
        LIVE
      </div>

      {/* Fullscreen Warning Overlay */}
      {showFullscreenWarning && (
        <div
          className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
          ref={fullscreenOverlayRef}
        >
          <div className="text-center p-6 max-w-md">
            <Lock className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-white text-2xl font-bold mb-4">Fullscreen Required</h2>
            <p className="text-gray-300 mb-6">
              This video must be viewed in fullscreen mode. Please click the button below to continue.
            </p>
            <p className="text-yellow-400 text-sm mb-6">
              Warning: Exiting fullscreen {fullscreenAttempts > 1 ? `${fullscreenAttempts} times` : "repeatedly"} will
              terminate your session.
            </p>
            <Button
              onClick={() => {
                if (document.documentElement) {
                  requestFullscreen(document.documentElement)
                  setShowFullscreenWarning(false)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Enter Fullscreen
            </Button>
          </div>
        </div>
      )}

      {/* ENHANCED CONTROLS BAR */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white z-10">
        <div className="flex justify-between items-center mb-2">
          {courseDetails?.title && <h1 className="text-xl font-bold">{courseDetails.title}</h1>}
        </div>

        {attendanceError && <div className="text-red-400 text-sm mt-2">{attendanceError}</div>}

        {hasCompletedVideo && (
          <div className="text-green-400 text-sm mt-2">Video completed! Returning to course list...</div>
        )}

        {/* ENHANCED CONTROL BAR */}
        <div className="flex items-center justify-between mt-4 bg-black/50 rounded-lg p-3">
          {/* Camera Controls */}
          <div className="flex items-center gap-2">
            {/* Video Preview Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCameraPreview}
              disabled={!cameraPermissionGranted || !cameraOn}
              className={`text-white hover:bg-white/20 flex items-center gap-2 ${
                showCameraPreview ? "bg-blue-600/20" : ""
              }`}
            >
              <Camera className="h-4 w-4" />
              Video Preview
            </Button>

            {/* Camera Toggle */}
            {cameraPermissionGranted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCamera}
                className={`text-white hover:bg-white/20 flex items-center gap-2 ${
                  cameraOn ? "bg-green-600/20" : "bg-gray-600/20"
                }`}
              >
                {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                {cameraOn ? "ON" : "OFF"}
              </Button>
            )}
          </div>

          {/* Emoji Reaction Bar */}
          <div className="flex items-center space-x-3">
            <button
              className="emoji-btn p-2 rounded-full hover:bg-white/20 transition-colors"
              onClick={() => {
                const btn = document.createElement("div")
                btn.className = "absolute animate-emoji text-2xl"
                btn.textContent = "✋"
                btn.style.bottom = "20%"
                btn.style.left = `${Math.random() * 80 + 10}%`
                if (videoWrapperRef.current) videoWrapperRef.current.appendChild(btn)
                setTimeout(() => btn.remove(), 2000)
              }}
            >
              <span className="text-xl">✋</span>
            </button>
            <button
              className="emoji-btn p-2 rounded-full hover:bg-white/20 transition-colors"
              onClick={() => {
                const btn = document.createElement("div")
                btn.className = "absolute animate-emoji text-2xl"
                btn.textContent = "❤️"
                btn.style.bottom = "20%"
                btn.style.left = `${Math.random() * 80 + 10}%`
                if (videoWrapperRef.current) videoWrapperRef.current.appendChild(btn)
                setTimeout(() => btn.remove(), 2000)
              }}
            >
              <span className="text-xl">❤️</span>
            </button>
            <button
              className="emoji-btn p-2 rounded-full hover:bg-white/20 transition-colors"
              onClick={() => {
                const btn = document.createElement("div")
                btn.className = "absolute animate-emoji text-2xl"
                btn.textContent = "👍"
                btn.style.bottom = "20%"
                btn.style.left = `${Math.random() * 80 + 10}%`
                if (videoWrapperRef.current) videoWrapperRef.current.appendChild(btn)
                setTimeout(() => btn.remove(), 2000)
              }}
            >
              <span className="text-xl">👍</span>
            </button>
            <button
              className="emoji-btn p-2 rounded-full hover:bg-white/20 transition-colors"
              onClick={() => {
                const btn = document.createElement("div")
                btn.className = "absolute animate-emoji text-2xl"
                btn.textContent = "😊"
                btn.style.bottom = "20%"
                btn.style.left = `${Math.random() * 80 + 10}%`
                if (videoWrapperRef.current) videoWrapperRef.current.appendChild(btn)
                setTimeout(() => btn.remove(), 2000)
              }}
            >
              <span className="text-xl">😊</span>
            </button>
            <button
              className="emoji-btn p-2 rounded-full hover:bg-white/20 transition-colors"
              onClick={() => {
                const btn = document.createElement("div")
                btn.className = "absolute animate-emoji text-2xl"
                btn.textContent = "👏"
                btn.style.bottom = "20%"
                btn.style.left = `${Math.random() * 80 + 10}%`
                if (videoWrapperRef.current) videoWrapperRef.current.appendChild(btn)
                setTimeout(() => btn.remove(), 2000)
              }}
            >
              <span className="text-xl">👏</span>
            </button>
          </div>

          {/* Exit Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExitClick}
            className="text-white hover:bg-red-600/20 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit
          </Button>
        </div>
      </div>
    </div>
  )
}
