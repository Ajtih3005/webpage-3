"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Camera, VideoIcon } from "lucide-react"
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
      loadYouTubeAPI()
    }
  }, [sessionId])

  const loadInstructorPoses = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ai/instructor-poses?sessionId=${sessionId}`)
      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] Error response:", result)
        throw new Error(result.error)
      }

      if (result.poses) {
        setInstructorPoses(result.poses)
        console.log("[v0] Loaded instructor poses:", result.poses.length)
      }

      if (result.session) {
        setCourseInfo(result.session)
        console.log("[v0] Course info:", result.session)
      }
    } catch (error) {
      console.error("[v0] Error loading instructor poses:", error)
      alert("Failed to load pose data. Check console for details.")
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
    // If MediaPipe not ready yet, wait for it
    if (!mediaPipeReady || !poseLandmarker) {
      setCameraActive(true) // Show loading state immediately
      console.log("[v0] Waiting for MediaPipe to load...")

      // Poll until MediaPipe is ready (max 10 seconds)
      let attempts = 0
      const checkInterval = setInterval(() => {
        attempts++
        if (mediaPipeReady && poseLandmarker) {
          clearInterval(checkInterval)
          console.log("[v0] MediaPipe ready, starting camera now...")
          initCamera()
        } else if (attempts > 50) {
          // 10 seconds timeout
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

  const findClosestPose = (currentTime: number) => {
    if (instructorPoses.length === 0) {
      console.log("[v0] No instructor poses available")
      return null
    }

    const currentTimeInSeconds = currentTime / 1000

    const closest = instructorPoses.reduce((closest, pose) => {
      const timeDiff = Math.abs(pose.timestamp - currentTimeInSeconds)
      const closestDiff = closest ? Math.abs(closest.timestamp - currentTimeInSeconds) : Number.POSITIVE_INFINITY
      return timeDiff < closestDiff ? pose : closest
    }, null)

    if (closest) {
      console.log("[v0] Found pose at", closest.timestamp, "for time", currentTimeInSeconds.toFixed(2))
    }

    return closest
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/pose-analytics"
            className="flex items-center text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Analytics
          </Link>
          <h1 className="text-3xl font-bold">Live Pose Testing</h1>
          <p className="text-muted-foreground">Compare your pose with the instructor in real-time</p>
        </div>
        <div className="text-right">
          {!mediaPipeReady && (
            <Badge variant="secondary" className="mb-2">
              Loading MediaPipe...
            </Badge>
          )}
          {mediaPipeReady && (
            <Badge variant="default" className="mb-2">
              MediaPipe Ready ✓
            </Badge>
          )}
          <div className="text-2xl font-bold">Accuracy: {currentAccuracy.toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center">
                <VideoIcon className="w-5 h-5 mr-2 text-blue-600" />
                Instructor Video
              </h3>
              {courseInfo && <Badge variant="outline">{instructorPoses.length} poses extracted</Badge>}
            </div>
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
              {youtubeId ? (
                <iframe
                  id="youtube-player"
                  src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=0`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Instructor Video"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <VideoIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No video available</p>
                    <p className="text-sm text-gray-400 mt-2">Upload instructor video during course creation</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium mb-2 block">Video Time (auto-synced)</label>
              <div className="text-sm text-gray-600">Current: {(currentVideoTime / 1000).toFixed(1)}s</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center">
                <Camera className="w-5 h-5 mr-2 text-green-600" />
                Your Webcam
              </h3>
              <Button
                onClick={cameraActive ? stopCamera : startCamera}
                className={cameraActive ? "bg-red-500 hover:bg-red-600" : ""}
                disabled={!mediaPipeReady && !cameraActive}
              >
                {cameraActive ? (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Stop Camera
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    {mediaPipeReady ? "Start Camera" : "Loading MediaPipe..."}
                  </>
                )}
              </Button>
            </div>
            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <video ref={webcamRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="absolute top-0 left-0 w-full h-full pointer-events-none scale-x-[-1]"
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Camera not active</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Live Accuracy Report</h3>

          {Object.keys(jointAccuracies).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(jointAccuracies).map(([joint, accuracy]: [string, any]) => (
                <div key={joint}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium capitalize">{joint.replace("_", " ")}</span>
                    <span className="text-sm font-semibold">{accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        accuracy >= 80 ? "bg-green-500" : accuracy >= 60 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(100, accuracy)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Start the camera and adjust the time slider to see live comparison</p>
              <p className="text-sm mt-2">Move the slider to match the instructor video timestamp</p>
            </div>
          )}
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
