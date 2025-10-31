"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { extractYoutubeVideoId } from "@/lib/utils"
import { ArrowLeft, Camera, X, Video, VideoOff, CameraOff, Brain } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import CameraPermission from "./camera-permission"

import AIEnhancedPlayer from "./ai-enhanced-player"

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
  // const [fullscreenBlocked, setFullscreenBlocked] = useState(false)
  // const [fullscreenAttempts, setFullscreenAttempts] = useState(0)
  // const [showFullscreenWarning, setShowFullscreenWarning] = useState(false)

  // Camera states
  const [showCameraPreview, setShowCameraPreview] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(false)

  const youtubePlayer = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement | null>(null)
  const videoTimer = useRef<NodeJS.Timeout | null>(null)
  const startVideoTimeout = useRef<NodeJS.Timeout | null>(null)
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null)
  // const fullscreenCheckInterval = useRef<NodeJS.Timeout | null>(null)
  // const fullscreenRetryTimeout = useRef<NodeJS.Timeout | null>(null)
  const isMounted = useRef(true)
  const videoWrapperRef = useRef<HTMLDivElement | null>(null)
  const fullscreenOverlayRef = useRef<HTMLDivElement | null>(null)
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null)

  // Camera functions
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: "user",
        },
        audio: false,
      })

      console.log("🎥 Camera stream obtained:", stream)
      setCameraStream(stream)
      setCameraOn(true)
      setCameraError(null)

      // FIXED: Ensure video element exists and set stream properly
      if (cameraVideoRef.current) {
        console.log("🎥 Setting video source...")

        // Clear any existing source first
        cameraVideoRef.current.srcObject = null

        // Set the new stream
        cameraVideoRef.current.srcObject = stream

        // Ensure the video element properties are set correctly
        cameraVideoRef.current.autoplay = true
        cameraVideoRef.current.muted = true
        cameraVideoRef.current.playsInline = true

        // Force load and play
        cameraVideoRef.current.load()

        cameraVideoRef.current.addEventListener("loadedmetadata", () => {
          console.log("🎥 Video metadata loaded, forcing play...")
          if (cameraVideoRef.current) {
            cameraVideoRef.current
              .play()
              .then(() => console.log("🎥 Video playing successfully!"))
              .catch((error) => console.error("🎥 Play failed:", error))
          }
        })

        // Also try immediate play
        cameraVideoRef.current
          .play()
          .then(() => console.log("🎥 Immediate play successful!"))
          .catch((error) => {
            console.error("🎥 Immediate play failed:", error)
            // Try again after a delay
            setTimeout(() => {
              if (cameraVideoRef.current) {
                cameraVideoRef.current.play().catch(console.error)
              }
            }, 500)
          })
      } else {
        console.error("🎥 Camera video ref not available!")
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
    console.log("🎥 Stopping camera...")
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        console.log("🎥 Stopping track:", track.kind)
        track.stop()
      })
      setCameraStream(null)
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null
    }

    setCameraOn(false)
    setCameraError(null)

    toast({
      title: "Camera Stopped",
      description: "Your camera has been turned off.",
    })
  }

  const toggleCameraPreview = () => {
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
    setCameraPermissionGranted(true)
    setShowCameraPermission(false)
    // Auto-enter fullscreen after camera permission
    // setTimeout(() => {
    //   if (document.documentElement) {
    //     requestFullscreen(document.documentElement)
    //   }
    // }, 500)
  }

  const handleSkipCamera = () => {
    setCameraPermissionGranted(false)
    setShowCameraPermission(false)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && playerContainerRef.current) {
      playerContainerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
        toast({
          title: "Fullscreen Error",
          description: "Unable to enter fullscreen mode. This may be due to browser restrictions.",
          variant: "destructive",
        })
      })
    } else if (document.fullscreenElement) {
      document.exitFullscreen()
    }
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

  useEffect(() => {
    // Set mounted flag
    isMounted.current = true

    // Add class to body to prevent scrolling and selection
    document.body.classList.add("video-playing")

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)

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
      // Apply fullscreen on mount
      const enterFullscreen = () => {
        if (document.documentElement) {
          requestFullscreen(document.documentElement)
        }
      }

      // Try to enter fullscreen after a short delay
      setTimeout(enterFullscreen, 1000)

      // Add fullscreen change event listeners for all browser variants
      // const handleFullscreenChange = () => {
      //   enforceFullscreen()
      // }

      // document.addEventListener("fullscreenchange", handleFullscreenChange)
      // document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
      // document.addEventListener("mozfullscreenchange", handleFullscreenChange)
      // document.addEventListener("MSFullscreenChange", handleFullscreenChange)

      // Start interval to continuously check fullscreen status
      // fullscreenCheckInterval.current = setInterval(() => {
      //   enforceFullscreen()
      // }, 1000)

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
        document.removeEventListener("fullscreenchange", handleFullscreenChange)

        isMounted.current = false

        // Force stop camera on cleanup
        console.log("🧹 Cleanup - force stopping camera...")
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => {
            console.log("🎥 Force stopping track on cleanup:", track.kind)
            track.stop()
          })
        }

        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = null
        }

        // Stop camera
        stopCamera()

        // Remove body class
        document.body.classList.remove("video-playing")
        document.body.classList.remove("inactive-cursor")

        if (videoTimer.current) clearInterval(videoTimer.current)
        if (startVideoTimeout.current) clearTimeout(startVideoTimeout.current)
        if (sessionCheckInterval.current) clearInterval(sessionCheckInterval.current)
        // if (fullscreenCheckInterval.current) clearInterval(fullscreenCheckInterval.current)
        // if (fullscreenRetryTimeout.current) clearTimeout(fullscreenRetryTimeout.current)
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
        // document.removeEventListener("fullscreenchange", handleFullscreenChange)
        // document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
        // document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
        // document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
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
  }, [])

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
  }, [courseDetails, showCameraPermission, sessionStartTime])

  // Calculate the current time position in the video based on session start time
  const calculateCurrentTimePosition = (startTime: Date): number => {
    const now = new Date()
    const elapsedMilliseconds = now.getTime() - startTime.getTime()
    return Math.floor(elapsedMilliseconds / 1000) // Convert to seconds
  }

  const checkSessionStatus = () => {
    if (!courseDetails || !sessionStartTime) return

    const now = new Date()
    const scheduledDate = new Date(courseDetails.scheduled_date)

    // Parse batch times if available
    const batchTimes = courseDetails.batch_times ? JSON.parse(courseDetails.batch_times) : null
    let startHour = scheduledDate.getHours()
    let startMinute = scheduledDate.getMinutes()

    if (batchTimes && batchTimes.start_time) {
      const [hour, minute] = batchTimes.start_time.split(":").map(Number)
      startHour = hour
      startMinute = minute
    }

    scheduledDate.setHours(startHour, startMinute, 0, 0)

    // Store the session start time
    if (!sessionStartTime) {
      setSessionStartTime(scheduledDate)
    }

    // Priority: 1. Actual YouTube duration, 2. 24 hours default (never use short database duration)
    const duration = actualVideoDuration || 86400 // Always default to 24 hours if YouTube duration not available

    console.log(
      "[v0] Session check - Using duration:",
      duration,
      "seconds (",
      Math.floor(duration / 3600),
      "hours",
      Math.floor((duration % 3600) / 60),
      "minutes)",
    )
    console.log("[v0] Actual video duration:", actualVideoDuration)
    console.log("[v0] Database duration:", courseDetails.videoDuration)

    const endTime = new Date(scheduledDate.getTime() + duration * 1000)

    // Check if current time is within the session time
    const isActive = now >= scheduledDate && now < endTime

    // Update session active state
    setSessionActive(isActive)

    const gracePeriod = 7200 // 2 hour grace period after video ends (was 1 hour)
    const sessionEndWithGrace = new Date(endTime.getTime() + gracePeriod * 1000)

    console.log("[v0] Session times:")
    console.log("[v0] - Scheduled start:", scheduledDate.toLocaleString())
    console.log("[v0] - Calculated end:", endTime.toLocaleString())
    console.log("[v0] - End with grace:", sessionEndWithGrace.toLocaleString())
    console.log("[v0] - Current time:", now.toLocaleString())
    console.log("[v0] - Session active:", isActive)

    if (now < scheduledDate) {
      // Session hasn't started yet
      console.log("[v0] Session hasn't started yet")
      toast({
        title: "Session Not Started",
        description: "This session hasn't started yet. Please wait for the scheduled time.",
        variant: "destructive",
      })
      setTimeout(() => {
        router.push("/user/access-course")
      }, 3000)
    } else if (now > sessionEndWithGrace && !hasCompletedVideo) {
      // Session ended with grace period and video not completed
      console.log("[v0] Session ended with grace period")
      toast({
        title: "Session Ended",
        description: "This session is no longer active. Returning to course list.",
        variant: "destructive",
      })
      setTimeout(() => {
        router.push("/user/access-course")
      }, 3000)
    } else {
      console.log("[v0] Session is active and running normally")
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

      const videoDuration = data.video_duration || 86400 // 24 hours maximum by default

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

  // Function to initialize YouTube player
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

      // Create new player
      youtubePlayer.current = new window.YT.Player("youtube-player", {
        videoId: youtubeVideoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          cc_load_policy: 0,
          playsinline: 1,
          origin: window.location.origin,
          mute: 0, // Ensure audio is not muted
          start: currentTimePosition > 0 ? currentTimePosition : 0, // Start from current position if joining late
        },
        events: {
          onReady: (event) => {
            console.log("YouTube player ready")

            // Set player size to fill container
            const iframe = event.target.getIframe()
            if (iframe) {
              iframe.style.width = "100vw"
              iframe.style.height = "100vh"
              iframe.style.position = "absolute"
              iframe.style.top = "0"
              iframe.style.left = "0"
              iframe.style.border = "none"

              // Add additional styles to prevent interaction
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

            const duration = event.target.getDuration()
            if (duration && duration > 0) {
              console.log(
                "[v0] Actual YouTube video duration detected:",
                duration,
                "seconds (",
                Math.floor(duration / 3600),
                "hours",
                Math.floor((duration % 3600) / 60),
                "minutes)",
              )

              setActualVideoDuration(duration)

              // Update course details with actual duration
              setCourseDetails((prev) => (prev ? { ...prev, videoDuration: duration } : null))

              // Force a session status check with the new duration
              setTimeout(() => {
                checkSessionStatus()
              }, 1000)
            }

            // Start video timer
            startVideoTimer()

            // Mark attendance after a delay
            startVideoTimeout.current = setTimeout(() => {
              markAttendance()
            }, 60000) // Mark attendance after 1 minute

            // Start the video at the current position if joining late
            if (currentTimePosition > 0) {
              event.target.seekTo(currentTimePosition, true)
            }

            event.target.playVideo()

            // Set volume to 100% (full sound)
            event.target.setVolume(100)
            // Ensure video is unmuted
            event.target.unMute()
          },
          onStateChange: (event) => {
            // YT.PlayerState.ENDED = 0
            if (event.data === 0) {
              handleVideoEnd()
            }

            // If video is paused, play it again (prevent user from pausing)
            if (event.data === 2) {
              // YT.PlayerState.PAUSED = 2
              event.target.playVideo()
            }

            // If video is buffering, show loading state
            if (event.data === 3) {
              // YT.PlayerState.BUFFERING = 3
              console.log("Video is buffering...")
            }
          },
          onError: (event) => {
            console.error("YouTube player error:", event.data)
            toast({
              title: "Video Error",
              description: "There was an error playing the video. Please try again.",
              variant: "destructive",
            })
          },
          onPlaybackQualityChange: (event) => {
            console.log("Playback quality changed to:", event.data)
          },
          onPlaybackRateChange: (event) => {
            if (event.data !== 1) {
              console.log("Playback rate changed to:", event.data, "- resetting to normal speed")
              event.target.setPlaybackRate(1)
            }
          },
        },
      })
    } catch (error) {
      console.error("Error initializing YouTube player:", error)

      // Fallback to iframe if YT Player fails
      if (playerContainerRef.current) {
        playerContainerRef.current.innerHTML = ""
        const iframe = document.createElement("iframe")

        // Add start parameter to start from current position if joining late
        const startParam = currentTimePosition > 0 ? `&start=${currentTimePosition}` : ""

        iframe.src = `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&controls=0&disablekb=1&fs=0&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&cc_load_policy=0&playsinlinecontrols=0&disablekb=1&fs=0&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&cc_load_policy=0&playsinline=1${startParam}&origin=${window.location.origin}`
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
    console.log("Starting video timer...")
    videoTimer.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)
  }

  // Function to handle video end
  const handleVideoEnd = async () => {
    console.log("📹 Video ended - stopping camera...")
    clearInterval(videoTimer.current!)
    setHasCompletedVideo(true)

    // Mark video as completed
    await markVideoCompleted()

    // Force stop camera
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        console.log("🎥 Force stopping track on video end:", track.kind)
        track.stop()
      })
      setCameraStream(null)
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null
    }

    setCameraOn(false)
    setShowCameraPreview(false)

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

  // Handle back button click
  const handleExitClick = () => {
    console.log("🚪 Exiting session - stopping camera...")

    // Force stop camera
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        console.log("🎥 Force stopping track:", track.kind)
        track.stop()
      })
      setCameraStream(null)
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null
    }

    setCameraOn(false)
    setShowCameraPreview(false)

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

    router.push("/user/access-course")
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {showCameraPermission && (
        <CameraPermission onPermissionGranted={handleCameraPermissionGranted} onSkip={handleSkipCamera} />
      )}

      {!showCameraPermission && (
        <>
          {aiAnalysisEnabled ? (
            <AIEnhancedPlayer
              courseId={params.courseId}
              userId={userDbId || 0}
              youtubeVideoId={youtubeVideoId}
              activityType={
                courseDetails?.title?.toLowerCase().includes("fitness")
                  ? "fitness"
                  : courseDetails?.title?.toLowerCase().includes("singing")
                    ? "singing"
                    : courseDetails?.title?.toLowerCase().includes("dance")
                      ? "dance"
                      : "yoga"
              }
            />
          ) : (
            <>
              {/* Existing video player implementation */}
              {/* <div
                className="fixed inset-0 bg-black flex flex-col w-screen h-screen overflow-hidden"
                ref={videoWrapperRef}
              > */}
              {/* Video Container */}
              <div
                ref={playerContainerRef}
                className={`relative w-full h-screen flex items-center justify-center ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
              >
                {/* Camera Preview goes HERE - inside the video container */}
                {showCameraPreview && (
                  <div className="absolute top-4 right-4 z-50 bg-black rounded-lg border-2 border-white overflow-hidden shadow-2xl">
                    <div className="relative">
                      <video
                        ref={cameraVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-48 h-36 object-cover bg-gray-800"
                        style={{ transform: "scaleX(-1)" }} // Mirror the video like a selfie
                      />
                      <button
                        onClick={() => setShowCameraPreview(false)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {/* Camera Status Indicator */}
                      <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                        {cameraOn ? "LIVE" : "OFF"}
                      </div>
                      {/* Show message when camera is off */}
                      {!cameraOn && (
                        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                          <div className="text-white text-center">
                            <CameraOff className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-xs">Camera Off</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* LIVE Indicator */}
                <div className="absolute top-2 left-2 z-50 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center">
                  <span className="animate-pulse mr-1 h-2 w-2 rounded-full bg-white inline-block"></span>
                  LIVE
                </div>

                {/* Fullscreen Warning Overlay */}
                {/* {showFullscreenWarning && (
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
                        Warning: Exiting fullscreen{" "}
                        {fullscreenAttempts > 1 ? `${fullscreenAttempts} times` : "repeatedly"} will terminate your
                        session.
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
                )} */}

                {/* NEW SIMPLIFIED CONTROLS BAR */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white z-10">
                  <div className="flex justify-between items-center mb-2">
                    {courseDetails?.title && <h1 className="text-xl font-bold">{courseDetails.title}</h1>}
                  </div>

                  {attendanceError && <div className="text-red-400 text-sm mt-2">{attendanceError}</div>}

                  {hasCompletedVideo && (
                    <div className="text-green-400 text-sm mt-2">Video completed! Returning to course list...</div>
                  )}

                  {/* NEW CONTROL BAR WITH CAMERA TOGGLE */}
                  <div className="flex items-center justify-between mt-4 bg-black/50 rounded-lg p-3">
                    {/* Camera Controls */}
                    <div className="flex items-center gap-2">
                      {/* Camera ON/OFF Toggle */}
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
                          {cameraOn ? "Camera ON" : "Camera OFF"}
                        </Button>
                      )}

                      {/* Video Preview Toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleCameraPreview}
                        disabled={!cameraPermissionGranted}
                        className={`text-white hover:bg-white/20 flex items-center gap-2 ${
                          showCameraPreview ? "bg-blue-600/20" : "bg-gray-600/20"
                        }`}
                      >
                        <Camera className="h-4 w-4" />
                        {showCameraPreview ? "Hide Preview" : "Show Preview"}
                      </Button>
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
              {/* </div> */}
            </>
          )}

          <div className="absolute top-4 right-4 z-30">
            <Button
              onClick={() => setAiAnalysisEnabled(!aiAnalysisEnabled)}
              className={`${aiAnalysisEnabled ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-600 hover:bg-gray-700"} text-white`}
            >
              <Brain className="w-4 h-4 mr-2" />
              {aiAnalysisEnabled ? "Disable AI" : "Enable AI"}
            </Button>
          </div>
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="bg-black/50 hover:bg-black/70 text-white"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
                </svg>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
