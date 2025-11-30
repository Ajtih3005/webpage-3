"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Camera, Eye, Maximize, X } from "lucide-react"
import { extractYoutubeVideoId } from "@/lib/utils"
import ZoomPlayerSimple from "@/components/zoom-player-simple"

export default function LiveSessionPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [courseData, setCourseData] = useState<any>(null)
  const [videoId, setVideoId] = useState<string>("")
  const [videoType, setVideoType] = useState<"youtube" | "zoom">("youtube")
  const [zoomMeetingId, setZoomMeetingId] = useState("")
  const [zoomPasscode, setZoomPasscode] = useState("")
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")

  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0)
  const [showEmojiPanel, setShowEmojiPanel] = useState(false)
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: string; emoji: string; left: number }>>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const [previewPosition, setPreviewPosition] = useState({ x: window.innerWidth - 220, y: window.innerHeight - 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    async function fetchCourse() {
      console.log("[v0] Fetching course data for ID:", courseId)
      const { data, error } = await supabase.from("courses").select("*").eq("id", courseId).single()

      if (error) {
        console.error("[v0] Error fetching course:", error)
        return
      }

      if (data) {
        console.log("[v0] Course data fetched:", data)
        setCourseData(data)

        const courseVideoType = data.video_type || "youtube"
        setVideoType(courseVideoType)
        console.log("[v0] Video type:", courseVideoType)

        if (courseVideoType === "zoom") {
          // Load Zoom meeting details
          setZoomMeetingId(data.zoom_meeting_id || "")
          setZoomPasscode(data.zoom_passcode || "")
          console.log("[v0] Zoom meeting ID:", data.zoom_meeting_id)
        } else {
          // Load YouTube video
          const videoUrl = data.youtube_link || data.video_url || data.youtube_url || ""
          console.log("[v0] Video URL from database:", videoUrl)
          const ytId = extractYoutubeVideoId(videoUrl)
          console.log("[v0] Extracted YouTube ID using utility:", ytId)
          if (ytId) {
            setVideoId(ytId)
            const scheduledDate = new Date(data.scheduled_date)
            const timeMatch = data.custom_batch_time?.match(/(\d+):(\d+)\s*(AM|PM)/)
            if (timeMatch) {
              let hours = Number.parseInt(timeMatch[1])
              const minutes = Number.parseInt(timeMatch[2])
              const period = timeMatch[3]

              if (period === "PM" && hours !== 12) hours += 12
              if (period === "AM" && hours === 12) hours = 0

              scheduledDate.setHours(hours, minutes, 0, 0)
              setSessionStartTime(scheduledDate)
            }
          } else {
            console.error("[v0] Failed to extract video ID from URL:", videoUrl)
          }
        }
      }
    }

    fetchCourse()

    const storedUserName = localStorage.getItem("userName") || localStorage.getItem("userAuthenticated") || "User"
    const storedUserEmail = localStorage.getItem("userEmail") || ""
    setUserName(storedUserName)
    setUserEmail(storedUserEmail)
  }, [courseId])

  useEffect(() => {
    if (!sessionStartTime || !videoDuration || videoDuration === 0) return

    const checkSessionStatus = () => {
      const now = new Date()
      const elapsedSeconds = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)

      if (elapsedSeconds > videoDuration + 5) {
        console.log("[v0] Session expired - elapsed:", elapsedSeconds, "duration:", videoDuration)
        // Redirect back to course page
        router.push(`/user/access-course?sessionEnded=${courseId}`)
      }
    }

    // Check immediately
    checkSessionStatus()

    // Check every second
    const interval = setInterval(checkSessionStatus, 1000)
    return () => clearInterval(interval)
  }, [sessionStartTime, videoDuration, router, courseId])

  useEffect(() => {
    if (videoType !== "youtube" || !videoId || !sessionStartTime) return

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initializePlayer()
      } else {
        const tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        const firstScriptTag = document.getElementsByTagName("script")[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
        window.onYouTubeIframeAPIReady = initializePlayer
      }
    }

    const initializePlayer = () => {
      if (!playerRef.current) {
        playerRef.current = new window.YT.Player("youtube-player", {
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            iv_load_policy: 3,
            enablejsapi: 1,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
          },
        })
      }
    }

    const onPlayerReady = (event: any) => {
      const duration = event.target.getDuration()
      setVideoDuration(duration)
      console.log("[v0] Video duration:", duration, "seconds")

      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null
        navigator.mediaSession.setActionHandler("play", null)
        navigator.mediaSession.setActionHandler("pause", null)
        navigator.mediaSession.setActionHandler("seekbackward", null)
        navigator.mediaSession.setActionHandler("seekforward", null)
        navigator.mediaSession.setActionHandler("seekto", null)
      }

      const now = new Date()
      const elapsedSeconds = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)
      console.log("[v0] Session started at:", sessionStartTime, "Elapsed seconds:", elapsedSeconds)

      if (elapsedSeconds > duration) {
        console.log("[v0] Session already ended")
        router.push(`/user/access-course?sessionEnded=${courseId}`)
        return
      } else if (elapsedSeconds > 0) {
        const prePlayTime = Math.max(0, elapsedSeconds - 10)
        console.log("[v0] User joined late, seeking to:", prePlayTime, "(10 sec before current:", elapsedSeconds, ")")
        event.target.seekTo(prePlayTime, true)
        event.target.playVideo()
      } else {
        console.log("[v0] User joined on time")
        event.target.playVideo()
      }
    }

    const onPlayerStateChange = (event: any) => {
      const monitorInterval = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const currentTime = playerRef.current.getCurrentTime()
          const now = new Date()
          const expectedTime = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)

          if (expectedTime > videoDuration) {
            console.log("[v0] Session time exceeded, kicking out user")
            clearInterval(monitorInterval)
            router.push(`/user/access-course?sessionEnded=${courseId}`)
            return
          }

          // If user is more than 5 seconds ahead, reset to correct position
          if (currentTime > expectedTime + 5) {
            console.log("[v0] User skipped ahead, resetting from", currentTime, "to", expectedTime)
            playerRef.current.seekTo(expectedTime, true)
            playerRef.current.pauseVideo()
            setTimeout(() => {
              playerRef.current.playVideo()
            }, 500)
          }

          setCurrentVideoTime(currentTime)
        }
      }, 1000)

      if (event.data === window.YT.PlayerState.ENDED) {
        clearInterval(monitorInterval)
        router.push(`/user/access-course?sessionEnded=${courseId}`)
      }
    }

    loadYouTubeAPI()

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [videoId, sessionStartTime, videoType])

  useEffect(() => {
    if (videoType === "youtube" && !stream && !cameraEnabled) {
      requestCamera()
    }
  }, [videoType])

  async function requestCamera() {
    if (stream || cameraEnabled) {
      console.log("[v0] Camera already active, skipping request")
      return
    }

    try {
      console.log("[v0] Requesting camera access...")
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      console.log("[v0] Camera access granted")

      setStream(mediaStream)
      setCameraEnabled(true)
    } catch (err) {
      console.error("[v0] Camera access denied:", err)
      setCameraEnabled(false)
    }
  }

  function toggleCamera() {
    if (cameraEnabled) {
      console.log("[v0] Turning camera off")
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        setStream(null)
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setCameraEnabled(false)
    } else {
      console.log("[v0] Turning camera on")
      requestCamera()
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (!previewRef.current) return
    const rect = previewRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDragging) return
      setPreviewPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }

    function handleMouseUp() {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset])

  function handleEmojiClick(emoji: string) {
    const id = Date.now().toString() + Math.random()
    const left = Math.random() * 80 + 10

    setFloatingEmojis((prev) => [...prev, { id, emoji, left }])

    // Remove emoji after animation completes
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id))
    }, 3000)
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  function handleExit() {
    console.log("[v0] Exiting session, stopping camera...")
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    router.push("/user/dashboard")
  }

  useEffect(() => {
    return () => {
      console.log("[v0] Component unmounting, cleaning up camera")
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (stream && videoRef.current && cameraEnabled && previewVisible) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch((err) => console.log("[v0] Video play error:", err))
    }
  }, [stream, previewVisible, cameraEnabled])

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {videoType === "zoom" ? (
        // Zoom Player Simple
        <ZoomPlayerSimple
          meetingNumber={zoomMeetingId}
          passcode={zoomPasscode}
          joinUrl={courseData?.zoom_join_url}
          userName={userName}
          courseId={courseId}
        />
      ) : (
        <>
          <div className="absolute top-4 left-4 z-50 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-bold">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>

          <div className="absolute inset-0 w-full h-full z-10">
            {videoId ? (
              <>
                <div id="youtube-player" className="w-full h-full" />
                <div className="absolute inset-0 w-full h-full z-20 cursor-default" style={{ pointerEvents: "all" }} />
              </>
            ) : (
              <div className="flex items-center justify-center w-full h-full text-white">
                <p>Loading video...</p>
              </div>
            )}
          </div>

          <style jsx global>{`
            #youtube-player iframe {
              pointer-events: none !important;
              user-select: none !important;
              -webkit-user-select: none !important;
              -moz-user-select: none !important;
              -ms-user-select: none !important;
            }
            #youtube-player {
              pointer-events: none !important;
            }
            #youtube-player iframe * {
              pointer-events: none !important;
              user-select: none !important;
            }
            @keyframes floatUp {
              0% {
                transform: translateY(0) scale(1);
                opacity: 1;
              }
              100% {
                transform: translateY(-500px) scale(1.8);
                opacity: 0;
              }
            }
            .emoji-float {
              animation: floatUp 3s ease-out forwards;
            }
          `}</style>

          {cameraEnabled && previewVisible && (
            <div
              ref={previewRef}
              className="absolute z-50 w-48 h-36 bg-gray-900 border-2 border-blue-500 rounded-lg overflow-hidden shadow-2xl cursor-move"
              style={{
                left: `${previewPosition.x}px`,
                top: `${previewPosition.y}px`,
              }}
              onMouseDown={handleMouseDown}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <div className="absolute top-2 right-2 text-white text-xs bg-black/50 px-2 py-1 rounded">You</div>
            </div>
          )}

          {floatingEmojis.map((item) => (
            <div
              key={item.id}
              className="fixed text-5xl pointer-events-none emoji-float z-40"
              style={{
                left: `${item.left}%`,
                bottom: "10%",
              }}
            >
              {item.emoji}
            </div>
          ))}

          <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleCamera}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                    cameraEnabled ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  {cameraEnabled ? "Camera ON" : "Camera OFF"}
                </button>
                <button
                  onClick={() => setPreviewVisible(!previewVisible)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg flex items-center gap-2 hover:bg-gray-600 transition"
                >
                  <Eye className="w-5 h-5" />
                  Preview
                </button>
              </div>

              <div className="flex items-center gap-2">
                {["😊", "❤️", "👍", "🔥", "💯", "😂", "🎉", "👏"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-2xl hover:scale-125 transition-transform p-2 hover:bg-gray-700/50 rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={toggleFullscreen}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  <Maximize className="w-5 h-5" />
                </button>
                <button
                  onClick={handleExit}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition"
                >
                  <X className="w-5 h-5" />
                  Exit
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
