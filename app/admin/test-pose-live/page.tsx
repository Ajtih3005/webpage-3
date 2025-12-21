"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Camera, VideoIcon } from "lucide-react"
import Link from "next/link"
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision"

function TestPoseLiveContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sessionId")

  const [instructorPoses, setInstructorPoses] = useState<any[]>([])
  const [courseInfo, setCourseInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cameraActive, setCameraActive] = useState(false)
  const [currentAccuracy, setCurrentAccuracy] = useState<number>(0)
  const [jointAccuracies, setJointAccuracies] = useState<any>({})
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const webcamRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const instructorCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (sessionId) {
      loadInstructorPoses()
      initializePoseLandmarker()
    }
  }, [sessionId])

  const loadInstructorPoses = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ai/instructor-poses?sessionId=${sessionId}`)
      const result = await response.json()

      if (!response.ok) throw new Error(result.error)

      if (result.poses) {
        setInstructorPoses(result.poses)
      }

      if (result.session) {
        setCourseInfo(result.session)
      }
    } catch (error) {
      console.error("Error loading instructor poses:", error)
    } finally {
      setLoading(false)
    }
  }

  const initializePoseLandmarker = async () => {
    try {
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
      console.log("[v0] PoseLandmarker initialized")
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
        startPoseDetection()
      }
    } catch (error) {
      console.error("[v0] Error accessing webcam:", error)
    }
  }

  const stopCamera = () => {
    if (webcamRef.current && webcamRef.current.srcObject) {
      const stream = webcamRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      setCameraActive(false)
    }
  }

  const startPoseDetection = () => {
    if (!poseLandmarker || !webcamRef.current || !canvasRef.current) return

    const detectPose = async () => {
      if (!webcamRef.current || !canvasRef.current || !cameraActive) return

      const videoTime = performance.now()
      const results = poseLandmarker.detectForVideo(webcamRef.current, videoTime)

      // Draw user pose on canvas
      const ctx = canvasRef.current.getContext("2d")
      if (ctx && results.landmarks && results.landmarks.length > 0) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        const drawingUtils = new DrawingUtils(ctx)
        drawingUtils.drawLandmarks(results.landmarks[0])
        drawingUtils.drawConnectors(results.landmarks[0], PoseLandmarker.POSE_CONNECTIONS)

        // Compare with instructor pose
        if (videoRef.current && instructorPoses.length > 0) {
          const currentVideoTime = videoRef.current.currentTime * 1000
          const closestInstructorPose = findClosestPose(currentVideoTime)

          if (closestInstructorPose) {
            const accuracy = calculatePoseAccuracy(results.landmarks[0], closestInstructorPose.pose_landmarks)
            setCurrentAccuracy(accuracy.overall)
            setJointAccuracies(accuracy.joints)
          }
        }
      }

      if (cameraActive) {
        requestAnimationFrame(detectPose)
      }
    }

    detectPose()
  }

  const findClosestPose = (currentTime: number) => {
    return instructorPoses.reduce((closest, pose) => {
      const timeDiff = Math.abs(pose.timestamp_ms - currentTime)
      const closestDiff = closest ? Math.abs(closest.timestamp_ms - currentTime) : Number.POSITIVE_INFINITY
      return timeDiff < closestDiff ? pose : closest
    }, null)
  }

  const calculatePoseAccuracy = (userLandmarks: any[], instructorLandmarks: any) => {
    const keyPoints = [
      { name: "left_shoulder", indices: [11, 12] },
      { name: "right_shoulder", indices: [11, 12] },
      { name: "left_elbow", indices: [11, 13] },
      { name: "right_elbow", indices: [12, 14] },
      { name: "left_hip", indices: [23, 24] },
      { name: "right_hip", indices: [23, 24] },
      { name: "left_knee", indices: [23, 25] },
      { name: "right_knee", indices: [24, 26] },
    ]

    const jointAccuracies: any = {}
    let totalAccuracy = 0

    keyPoints.forEach((point) => {
      const userPoint = userLandmarks[point.indices[0]]
      const instructorPoint = instructorLandmarks[point.indices[0]]

      if (userPoint && instructorPoint) {
        const distance = Math.sqrt(
          Math.pow(userPoint.x - instructorPoint.x, 2) +
            Math.pow(userPoint.y - instructorPoint.y, 2) +
            Math.pow(userPoint.z - instructorPoint.z, 2),
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
              {courseInfo?.youtube_link ? (
                <video
                  ref={videoRef}
                  src={courseInfo.youtube_link}
                  controls
                  className="w-full h-full"
                  onPlay={() => cameraActive && startPoseDetection()}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">No video available</div>
              )}
              <canvas ref={instructorCanvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
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
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Start the camera and play the instructor video to see live comparison</p>
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
