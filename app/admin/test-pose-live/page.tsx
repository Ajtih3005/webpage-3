"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Camera, VideoIcon, X, Play } from "lucide-react"
import Link from "next/link"

function TestPoseLiveContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sessionId")

  const [instructorPoses, setInstructorPoses] = useState<any[]>([])
  const [courseInfo, setCourseInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mediaPipeReady, setMediaPipeReady] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [currentAccuracy, setCurrentAccuracy] = useState<number>(0)
  const [jointAccuracies, setJointAccuracies] = useState<any>({})
  const [poseLandmarker, setPoseLandmarker] = useState<any | null>(null)
  const [currentVideoTime, setCurrentVideoTime] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const webcamRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const youtubePlayerRef = useRef<any>(null)
  const timerRef = useRef<number>()
  const timerRunningRef = useRef(false)

  useEffect(() => {
    console.log("[v0] Page loaded, starting MediaPipe initialization...")
    initializePoseLandmarker()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current)
      }
      timerRunningRef.current = false
    }
  }, []) // Empty dependency array = runs once on mount

  useEffect(() => {
    if (sessionId) {
      loadInstructorPoses()
    }
  }, [sessionId])

  const loadInstructorPoses = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ai/instructor-poses?sessionId=${sessionId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load poses")
      }

      console.log("[v0] Instructor poses loaded:", result.poses?.length || 0, "frames")
      console.log("[v0] Video URL from database:", result.video_url)

      setInstructorPoses(result.poses || [])
      setCourseInfo(result)

      if (result.video_url) {
        console.log("[v0] YouTube URL found, preparing player")
        loadYouTubeAPI()
      }
    } catch (error: any) {
      console.error("[v0] Error loading instructor poses:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const initializePoseLandmarker = async () => {
    try {
      console.log("[v0] Initializing MediaPipe PoseLandmarker...")
      setMediaPipeReady(false)

      const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision")

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
      )
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      })
      setPoseLandmarker(landmarker)
      setMediaPipeReady(true)
      console.log("[v0] ✅ PoseLandmarker initialized and ready!")
    } catch (error) {
      console.error("[v0] ❌ Error initializing PoseLandmarker:", error)
      setMediaPipeReady(false)
    }
  }

  const startCamera = async () => {
    if (!mediaPipeReady || !poseLandmarker) {
      setCameraActive(true)
      console.log("[v0] Waiting for MediaPipe to load...")

      let attempts = 0
      const checkInterval = setInterval(() => {
        attempts++
        if (mediaPipeReady && poseLandmarker) {
          clearInterval(checkInterval)
          console.log("[v0] MediaPipe ready, starting camera now...")
          initCamera()
        } else if (attempts > 50) {
          clearInterval(checkInterval)
          setCameraActive(false)
          console.error("[v0] MediaPipe failed to load")
        }
      }, 200)
      return
    }

    initCamera()
  }

  const initCamera = async () => {
    console.log("[v0] Starting camera with MediaPipe ready...")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      })

      if (webcamRef.current) {
        webcamRef.current.srcObject = stream
        setCameraActive(true)
        console.log("[v0] Camera started successfully")

        webcamRef.current.onloadedmetadata = () => {
          console.log("[v0] Webcam video loaded, starting pose detection...")
          requestAnimationFrame(() => {
            startPoseDetection()
            startTimer()
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error accessing webcam:", error)
      setCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (webcamRef.current && webcamRef.current.srcObject) {
      const stream = webcamRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      webcamRef.current.srcObject = null
      setCameraActive(false)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current)
        timerRef.current = undefined
      }
      timerRunningRef.current = false
      setCurrentVideoTime(0)
      setCurrentAccuracy(0)
      setJointAccuracies({})
      console.log("[v0] Camera stopped, all timers cleared")
    }
  }

  const findClosestPose = (currentTimeMs: number) => {
    if (instructorPoses.length === 0) return null

    const currentTimeSec = currentTimeMs / 1000
    console.log("[v0] 🔍 Looking for instructor pose at:", currentTimeSec.toFixed(2) + "s")

    let closest = instructorPoses[0]
    let minDiff = Math.abs(instructorPoses[0].timestamp - currentTimeSec)

    for (const pose of instructorPoses) {
      const diff = Math.abs(pose.timestamp - currentTimeSec)
      if (diff < minDiff) {
        minDiff = diff
        closest = pose
      }
    }

    console.log(
      "[v0] 📍 Closest instructor pose at:",
      closest.timestamp.toFixed(2) + "s",
      "Difference:",
      minDiff.toFixed(2) + "s",
    )
    return minDiff < 0.5 ? closest : null
  }

  const calculatePoseAccuracy = (userLandmarks: any[], instructorLandmarks: any[]) => {
    if (!instructorLandmarks || instructorLandmarks.length === 0) {
      console.log("[v0] No instructor landmarks to compare")
      return { overall: 0, joints: {} }
    }

    console.log(
      "[v0] Comparing poses - User landmarks:",
      userLandmarks.length,
      "Instructor landmarks:",
      instructorLandmarks.length,
    )

    const keyPoints = [
      { name: "left_shoulder", userIndex: 11, instructorIndex: 0 },
      { name: "right_shoulder", userIndex: 12, instructorIndex: 1 },
      { name: "left_elbow", userIndex: 13, instructorIndex: 2 },
      { name: "right_elbow", userIndex: 14, instructorIndex: 3 },
      { name: "left_wrist", userIndex: 15, instructorIndex: 4 },
      { name: "right_wrist", userIndex: 16, instructorIndex: 5 },
      { name: "left_hip", userIndex: 23, instructorIndex: 6 },
      { name: "right_hip", userIndex: 24, instructorIndex: 7 },
      { name: "left_knee", userIndex: 25, instructorIndex: 8 },
      { name: "right_knee", userIndex: 26, instructorIndex: 9 },
      { name: "left_ankle", userIndex: 27, instructorIndex: 10 },
      { name: "right_ankle", userIndex: 28, instructorIndex: 11 },
    ]

    const jointAccuracies: any = {}
    let totalAccuracy = 0
    let validJoints = 0

    keyPoints.forEach((point) => {
      const userPoint = userLandmarks[point.userIndex]
      const instructorPoint = instructorLandmarks[point.instructorIndex]

      if (userPoint && instructorPoint && instructorPoint.x !== undefined) {
        const distance = Math.sqrt(
          Math.pow(userPoint.x - instructorPoint.x, 2) +
            Math.pow(userPoint.y - instructorPoint.y, 2) +
            Math.pow((userPoint.z || 0) - (instructorPoint.z || 0), 2),
        )

        const accuracy = Math.max(0, 100 - distance * 100)
        jointAccuracies[point.name] = accuracy
        totalAccuracy += accuracy
        validJoints++
      }
    })

    const overall = validJoints > 0 ? totalAccuracy / validJoints : 0
    console.log("[v0] Calculated accuracy:", overall.toFixed(1) + "%", "Valid joints:", validJoints)

    return {
      overall,
      joints: jointAccuracies,
    }
  }

  const getYouTubeId = (url: string) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  const youtubeId = courseInfo?.video_url ? getYouTubeId(courseInfo.video_url) : null

  const loadYouTubeAPI = () => {
    if (!(window as any).YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }
  }

  useEffect(() => {
    if (youtubeId && (window as any).YT) {
      ;(window as any).onYouTubeIframeAPIReady = () => {
        youtubePlayerRef.current = new (window as any).YT.Player("youtube-player", {
          videoId: youtubeId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: () => {
              console.log("[v0] YouTube player ready")
              startTimer()
            },
          },
        })
      }
    }
  }, [youtubeId])

  const startTimer = () => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current)
    }

    console.log("[v0] Starting timer...")
    timerRunningRef.current = true
    let lastTime = Date.now()

    const updateTimer = () => {
      if (!timerRunningRef.current) {
        console.log("[v0] Timer stopped")
        return
      }

      const now = Date.now()
      const deltaTime = now - lastTime
      lastTime = now

      if (youtubePlayerRef.current && youtubePlayerRef.current.getCurrentTime) {
        try {
          const currentTime = youtubePlayerRef.current.getCurrentTime() * 1000
          setCurrentVideoTime(currentTime)
        } catch (error) {
          setCurrentVideoTime((prev) => prev + deltaTime)
        }
      } else {
        setCurrentVideoTime((prev) => {
          const newTime = prev + deltaTime
          if (Math.floor(newTime / 1000) !== Math.floor(prev / 1000)) {
            console.log("[v0] Timer:", (newTime / 1000).toFixed(1) + "s")
          }
          return newTime
        })
      }

      timerRef.current = requestAnimationFrame(updateTimer)
    }

    timerRef.current = requestAnimationFrame(updateTimer)
  }

  const startPoseDetection = () => {
    if (!poseLandmarker) {
      console.error("[v0] MediaPipe not initialized!")
      alert("MediaPipe is not ready. Please refresh the page.")
      return
    }

    if (!webcamRef.current || !canvasRef.current) {
      console.error("[v0] Video or canvas ref missing!")
      return
    }

    console.log("[v0] ✅ All systems ready - Starting pose detection loop...")
    console.log("[v0] MediaPipe ready:", !!poseLandmarker)
    console.log("[v0] Webcam ready:", !!webcamRef.current)
    console.log("[v0] Canvas ready:", !!canvasRef.current)
    console.log("[v0] Instructor poses loaded:", instructorPoses.length)

    const detectPose = async () => {
      if (!webcamRef.current || !canvasRef.current || !cameraActive || !poseLandmarker) {
        return
      }

      try {
        const videoTime = performance.now()
        const results = poseLandmarker.detectForVideo(webcamRef.current, videoTime)

        console.log("[v0] 🎥 Pose detection result:", {
          landmarksDetected: results.landmarks?.length || 0,
          currentTime: (currentVideoTime / 1000).toFixed(2) + "s",
        })

        if (results.landmarks && results.landmarks.length > 0) {
          const ctx = canvasRef.current.getContext("2d")
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

          const { DrawingUtils, PoseLandmarker: PL } = await import("@mediapipe/tasks-vision")
          const drawingUtils = new DrawingUtils(ctx)
          drawingUtils.drawLandmarks(results.landmarks[0])
          drawingUtils.drawConnectors(results.landmarks[0], PL.POSE_CONNECTIONS)

          console.log("[v0] ✅ User pose detected - Drawing skeleton")

          if (instructorPoses.length > 0 && currentVideoTime > 0) {
            const closestInstructorPose = findClosestPose(currentVideoTime)

            if (closestInstructorPose && closestInstructorPose.landmarks) {
              console.log("[v0] 🎯 Found matching instructor pose, calculating accuracy...")
              const accuracy = calculatePoseAccuracy(results.landmarks[0], closestInstructorPose.landmarks)
              setCurrentAccuracy(accuracy.overall)
              setJointAccuracies(accuracy.joints)
              console.log("[v0] ✅ Accuracy updated:", accuracy.overall.toFixed(1) + "%")
            } else {
              console.log("[v0] ⚠️ No instructor pose found for time:", (currentVideoTime / 1000).toFixed(2) + "s")
            }
          }
        } else {
          console.log("[v0] ⚠️ No user pose detected in frame")
        }
      } catch (error) {
        console.error("[v0] ❌ Pose detection error:", error)
      }

      if (cameraActive) {
        animationFrameRef.current = requestAnimationFrame(detectPose)
      }
    }

    detectPose()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pose data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">Error: {error}</p>
            <Link href="/admin/pose-analytics">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!sessionId || instructorPoses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">No pose data found for this session.</p>
            <Link href="/admin/pose-analytics">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Pose Testing</h1>
          <p className="text-muted-foreground">Compare your pose with the instructor in real-time</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={mediaPipeReady ? "default" : "secondary"}>
            MediaPipe: {mediaPipeReady ? "Ready" : "Loading..."}
          </Badge>
          <Link href="/admin/pose-analytics">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analytics
            </Button>
          </Link>
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="inline-block px-6 py-2 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-2xl font-bold text-blue-600">Accuracy: {currentAccuracy.toFixed(1)}%</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <VideoIcon className="w-5 h-5" />
                <CardTitle>Instructor Video</CardTitle>
              </div>
              <Badge variant="outline">{instructorPoses.length} poses extracted</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {youtubeId ? (
              <>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <div id="youtube-player" className="w-full h-full"></div>
                </div>
                <p className="mt-2 text-xs text-gray-500">Video ID: {youtubeId}</p>
              </>
            ) : courseInfo?.video_url ? (
              <div className="aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center text-white">
                <VideoIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Unable to play video</p>
                <p className="text-sm text-gray-400 mt-2 px-4 text-center break-all">URL: {courseInfo.video_url}</p>
              </div>
            ) : (
              <div className="aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center text-white">
                <VideoIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">No video available</p>
                <p className="text-sm text-gray-400 mt-2">Upload instructor video during course creation</p>
              </div>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Video Time (auto-synced)</p>
              <p className="font-mono text-lg">Current: {(currentVideoTime / 1000).toFixed(1)}s</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                <CardTitle>Your Webcam</CardTitle>
              </div>
              {cameraActive ? (
                <Button onClick={stopCamera} variant="destructive" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Stop Camera
                </Button>
              ) : (
                <Button onClick={startCamera} variant="default" size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video ref={webcamRef} autoPlay playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <Camera className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Camera not active</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Comparison Analytics</CardTitle>
          <p className="text-sm text-muted-foreground">Real-time joint-by-joint accuracy breakdown</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(jointAccuracies).map(([joint, accuracy]: [string, any]) => (
              <div key={joint} className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs text-gray-600 mb-1 capitalize">{joint.replace("_", " ")}</p>
                <p className="text-lg font-bold text-blue-600">{accuracy.toFixed(1)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${accuracy}%` }}></div>
                </div>
              </div>
            ))}
            {Object.keys(jointAccuracies).length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                <p>Start camera to see live analytics</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TestPoseLivePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <TestPoseLiveContent />
    </Suspense>
  )
}
