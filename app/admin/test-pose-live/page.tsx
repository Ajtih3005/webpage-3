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
  const [cameraActive, setCameraActive] = useState(false)
  const [currentAccuracy, setCurrentAccuracy] = useState<number>(0)
  const [jointAccuracies, setJointAccuracies] = useState<any>({})
  const [poseLandmarker, setPoseLandmarker] = useState<any | null>(null)
  const [currentVideoTime, setCurrentVideoTime] = useState(0)

  const webcamRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const youtubePlayerRef = useRef<any>(null)

  useEffect(() => {
    if (sessionId) {
      loadInstructorPoses()
      initializePoseLandmarker()
      loadYouTubeAPI()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
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
      console.log("[v0] PoseLandmarker initialized successfully")
    } catch (error) {
      console.error("[v0] Error initializing PoseLandmarker:", error)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      })

      if (webcamRef.current) {
        webcamRef.current.srcObject = stream
        setCameraActive(true)
        console.log("[v0] Camera started")
        setTimeout(() => {
          startPoseDetection()
          startTimer()
        }, 100)
      }
    } catch (error) {
      console.error("[v0] Error accessing webcam:", error)
      alert("Unable to access webcam. Please grant camera permissions.")
    }
  }

  const stopCamera = () => {
    if (webcamRef.current && webcamRef.current.srcObject) {
      const stream = webcamRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      setCameraActive(false)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      console.log("[v0] Camera stopped")
    }
  }

  const startPoseDetection = () => {
    if (!poseLandmarker || !webcamRef.current || !canvasRef.current) {
      console.log("[v0] Cannot start pose detection - missing requirements")
      return
    }

    const detectPose = async () => {
      if (!webcamRef.current || !canvasRef.current || !cameraActive || !poseLandmarker) return

      try {
        const videoTime = performance.now()
        const results = poseLandmarker.detectForVideo(webcamRef.current, videoTime)

        // Draw user pose on canvas
        const ctx = canvasRef.current.getContext("2d")
        if (ctx && results.landmarks && results.landmarks.length > 0) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

          const { DrawingUtils, PoseLandmarker: PL } = await import("@mediapipe/tasks-vision")
          const drawingUtils = new DrawingUtils(ctx)
          drawingUtils.drawLandmarks(results.landmarks[0])
          drawingUtils.drawConnectors(results.landmarks[0], PL.POSE_CONNECTIONS)

          // Compare with instructor pose at current video time
          if (instructorPoses.length > 0) {
            const closestInstructorPose = findClosestPose(currentVideoTime)

            if (closestInstructorPose) {
              const accuracy = calculatePoseAccuracy(
                results.landmarks[0],
                closestInstructorPose.pose_landmarks.landmarks,
              )
              setCurrentAccuracy(accuracy.overall)
              setJointAccuracies(accuracy.joints)
            }
          }
        }
      } catch (error) {
        console.error("[v0] Pose detection error:", error)
      }

      if (cameraActive) {
        animationFrameRef.current = requestAnimationFrame(detectPose)
      }
    }

    detectPose()
  }

  const findClosestPose = (currentTime: number) => {
    if (instructorPoses.length === 0) return null

    return instructorPoses.reduce((closest, pose) => {
      const timeDiff = Math.abs(pose.timestamp_ms - currentTime)
      const closestDiff = closest ? Math.abs(closest.timestamp_ms - currentTime) : Number.POSITIVE_INFINITY
      return timeDiff < closestDiff ? pose : closest
    }, null)
  }

  const calculatePoseAccuracy = (userLandmarks: any[], instructorLandmarks: any[]) => {
    const keyPoints = [
      { name: "left_shoulder", index: 11 },
      { name: "right_shoulder", index: 12 },
      { name: "left_elbow", index: 13 },
      { name: "right_elbow", index: 14 },
      { name: "left_hip", index: 23 },
      { name: "right_hip", index: 24 },
      { name: "left_knee", index: 25 },
      { name: "right_knee", index: 26 },
    ]

    const jointAccuracies: any = {}
    let totalAccuracy = 0

    keyPoints.forEach((point) => {
      const userPoint = userLandmarks[point.index]
      const instructorPoint = instructorLandmarks[point.index]

      if (userPoint && instructorPoint) {
        const distance = Math.sqrt(
          Math.pow(userPoint.x - instructorPoint.x, 2) +
            Math.pow(userPoint.y - instructorPoint.y, 2) +
            Math.pow((userPoint.z || 0) - (instructorPoint.z || 0), 2),
        )

        const accuracy = Math.max(0, 100 - distance * 100)
        jointAccuracies[point.name] = accuracy
        totalAccuracy += accuracy
      }
    })

    return {
      overall: totalAccuracy / keyPoints.length,
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
    let lastTime = Date.now()

    const updateTimer = () => {
      if (!cameraActive) return

      const now = Date.now()
      const deltaTime = now - lastTime
      lastTime = now

      if (youtubePlayerRef.current && youtubePlayerRef.current.getCurrentTime) {
        // Sync with YouTube if available
        const currentTime = youtubePlayerRef.current.getCurrentTime() * 1000
        setCurrentVideoTime(currentTime)
      } else {
        // Use internal timer when no video - increment by actual elapsed time
        setCurrentVideoTime((prev) => prev + deltaTime)
      }

      requestAnimationFrame(updateTimer)
    }

    requestAnimationFrame(updateTimer)
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
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/pose-analytics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analytics
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Live Pose Testing</h1>
          <p className="text-gray-600">Compare your pose with the instructor in real-time</p>
        </div>
        <div className="text-right">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Accuracy: {currentAccuracy.toFixed(1)}%
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructor Video */}
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

        {/* Admin Webcam */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center">
                <Camera className="w-5 h-5 mr-2 text-green-600" />
                Your Webcam
              </h3>
              <Button
                onClick={cameraActive ? stopCamera : startCamera}
                variant={cameraActive ? "destructive" : "default"}
                size="sm"
              >
                {cameraActive ? "Stop Camera" : "Start Camera"}
              </Button>
            </div>
            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <video ref={webcamRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
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

      {/* Live Accuracy Report */}
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
