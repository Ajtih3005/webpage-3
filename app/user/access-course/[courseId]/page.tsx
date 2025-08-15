"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { extractYoutubeVideoId } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

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
    setTimeout(() => {
      if (document.documentElement) {
        requestFullscreen(document.documentElement)
      }
    }, 500)
  }

  const handleSkipCamera = () => {
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
      // Apply fullscreen on mount
      const enterFullscreen = () => {
        if (document.documentElement) {
          requestFullscreen(document.documentElement)
        }
      }

      // Try to enter fullscreen after a short delay
      setTimeout(enterFullscreen, 1000)

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

  const calculateLiveTimestamp = () => {
    if (!sessionStartTime) return 0

    const now = new Date()
    const elapsedMs = now.getTime() - sessionStartTime.getTime()
    const elapsedSeconds = Math.floor(elapsedMs / 1000)

    // Support videos up to 24 hours (86400 seconds)
    return Math.min(elapsedSeconds, 86400)
  }

  useEffect(() => {
    if (sessionActive && sessionStartTime) {
      const interval = setInterval(() => {
        const newPosition = calculateLiveTimestamp()
        setCurrentTimePosition(newPosition)

        // If YouTube player is ready, seek to current live position
        if (youtubePlayer.current && youtubePlayer.current.seekTo) {
          youtubePlayer.current.seekTo(newPosition, true)
        }
      }, 60000) // Update every minute

      return () => clearInterval(interval)
    }
  }, [sessionActive, sessionStartTime])

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

  // Function to initialize YouTube player
  const initializeYouTubePlayer = () => {
    if (!window.YT || !window.YT.Player || !playerContainerRef.current || !youtubeVideoId) {
      console.log("YouTube API or player container not ready")
      return
    }

    if (!sessionStartTime) {
      setSessionStartTime(new Date())
    }

    const livePosition = calculateLiveTimestamp()
    setCurrentTimePosition(livePosition)

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
          controls: 0, // Completely disable controls for live streaming
          disablekb: 1, // Disable keyboard shortcuts
          fs: 0, // Disable fullscreen button
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          cc_load_policy: 0,
          playsinline: 1,
          origin: window.location.origin,
          mute: 0, // Ensure audio is not muted
          start: livePosition > 0 ? livePosition : 0, // Start from live timestamp
        },
        events: {
          onReady: (event) => {
            console.log("YouTube player ready for live streaming")

            const iframe = event.target.getIframe()
            if (iframe) {
              iframe.style.width = "100vw"
              iframe.style.height = "100vh"
              iframe.style.position = "absolute"
              iframe.style.top = "0"
              iframe.style.left = "0"
              iframe.style.border = "none"
              iframe.style.pointerEvents = "none" // Completely disable interaction
              iframe.style.userSelect = "none"
            }

            const overlay = document.createElement("div")
            overlay.style.position = "absolute"
            overlay.style.top = "0"
            overlay.style.left = "0"
            overlay.style.width = "100%"
            overlay.style.height = "100%"
            overlay.style.zIndex = "10"
            overlay.style.backgroundColor = "transparent"
            overlay.style.pointerEvents = "auto"
            overlay.addEventListener("contextmenu", (e) => e.preventDefault())

            if (playerContainerRef.current) {
              playerContainerRef.current.appendChild(overlay)
            }

            // Get the actual video duration (supports 10+ hour videos)
            const duration = event.target.getDuration()
            if (duration && duration > 0) {
              console.log(`Video duration: ${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`)
              setActualVideoDuration(duration)
            }

            // Start video timer
            startVideoTimer()

            // Mark attendance after a delay
            startVideoTimeout.current = setTimeout(() => {
              markAttendance()
            }, 60000)

            if (livePosition > 0) {
              console.log(`Starting video from live position: ${Math.floor(livePosition / 60)}m ${livePosition % 60}s`)
              event.target.seekTo(livePosition, true)
            }

            event.target.playVideo()
            event.target.setVolume(100)
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              setHasCompletedVideo(true)
            }
          },
        },
      })
    } catch (error) {
      console.error("Error initializing YouTube player:", error)
    }
  }

  // Function to start video timer
  const startVideoTimer = () => {
    if (videoTimer.current) clearInterval(videoTimer.current)

    videoTimer.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)
  }

  // Function to mark attendance
  const markAttendance = async () => {
    if (!userDbId || !courseDetails) return

    setMarkingAttendance(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("attendance").insert([
        {
          user_id: userDbId,
          course_id: courseDetails.id,
          timestamp: new Date(),
        },
      ])

      if (error) {
        throw error
      }

      toast({
        title: "Attendance Marked",
        description: "Your attendance has been successfully marked.",
      })
    } catch (error: any) {
      console.error("Error marking attendance:", error)
      toast({
        title: "Attendance Error",
        description: error.message || "Failed to mark attendance. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setMarkingAttendance(false)
    }
  }
}
