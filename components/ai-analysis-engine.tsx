"use client"

import { useEffect, useRef, useState } from "react"
import { startAISession, savePoseAnalysis, endAISession } from "@/app/actions/ai-actions"

interface PoseLandmark {
  x: number
  y: number
  z?: number
  visibility?: number
}

interface PoseData {
  landmarks: PoseLandmark[]
  timestamp: number
  confidence: number
}

interface AIAnalysisEngineProps {
  isActive: boolean
  instructorVideoElement: HTMLVideoElement | null
  userVideoElement: HTMLVideoElement | null
  courseId: string
  userId: number
  activityType: string
  onFeedback: (feedback: string, score: number) => void
  onSessionComplete: (reportData: any) => void
}

export default function AIAnalysisEngine({
  isActive,
  instructorVideoElement,
  userVideoElement,
  courseId,
  userId,
  activityType,
  onFeedback,
  onSessionComplete,
}: AIAnalysisEngineProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [poseAnalysisData, setPoseAnalysisData] = useState<any[]>([])
  const [userEmail, setUserEmail] = useState<string>("")

  const mediaPipeRef = useRef<any>(null)
  const instructorCanvasRef = useRef<HTMLCanvasElement>(null)
  const userCanvasRef = useRef<HTMLCanvasElement>(null)
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sessionStartTime = useRef<Date | null>(null)

  useEffect(() => {
    if (!isActive) return

    const initializeMediaPipe = async () => {
      try {
        const script = document.createElement("script")
        script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js"
        script.onload = async () => {
          const { Pose } = (window as any).mediapipe_pose || {}
          if (!Pose) {
            console.error("MediaPipe Pose not loaded")
            return
          }

          mediaPipeRef.current = new Pose({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
            },
          })

          mediaPipeRef.current.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          })

          setIsInitialized(true)
          console.log("[v0] MediaPipe Pose initialized successfully")
        }

        document.head.appendChild(script)
      } catch (error) {
        console.error("[v0] Error initializing MediaPipe:", error)
      }
    }

    initializeMediaPipe()
  }, [isActive])

  useEffect(() => {
    if (!isInitialized || !isActive) return

    const startSession = async () => {
      try {
        sessionStartTime.current = new Date()

        const email = localStorage.getItem("userEmail") || `user${userId}@example.com`
        setUserEmail(email)

        const result = await startAISession(userId, Number.parseInt(courseId), activityType, email)

        if (!result.success) {
          throw new Error(result.error)
        }

        setSessionId(result.sessionId)
        console.log("[v0] AI analysis session started:", result.sessionId)

        startRealTimeAnalysis()
      } catch (error) {
        console.error("[v0] Error starting AI session:", error)
      }
    }

    startSession()

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current)
      }
    }
  }, [isInitialized, isActive, userId, courseId, activityType])

  const startRealTimeAnalysis = () => {
    if (!mediaPipeRef.current || !sessionId) return

    analysisIntervalRef.current = setInterval(async () => {
      try {
        const instructorPose = await analyzePoseFromVideo(instructorVideoElement, instructorCanvasRef.current)
        const userPose = await analyzePoseFromVideo(userVideoElement, userCanvasRef.current)

        if (instructorPose && userPose) {
          const comparison = comparePoses(instructorPose, userPose)

          const analysisData = {
            timestamp_seconds: Math.floor((Date.now() - sessionStartTime.current!.getTime()) / 1000),
            pose_name: detectPoseName(instructorPose),
            accuracy_score: comparison.score,
            alignment_feedback: comparison.feedback,
            instructor_pose_data: instructorPose,
            user_pose_data: userPose,
            comparison_data: comparison,
          }

          await savePoseAnalysis(sessionId, analysisData)
          onFeedback(comparison.feedback, comparison.score)
          setPoseAnalysisData((prev) => [...prev, analysisData])
        }
      } catch (error) {
        console.error("[v0] Error in real-time analysis:", error)
      }
    }, 2000)
  }

  const analyzePoseFromVideo = async (
    videoElement: HTMLVideoElement | null,
    canvas: HTMLCanvasElement | null,
  ): Promise<PoseData | null> => {
    if (!videoElement || !canvas || !mediaPipeRef.current) return null

    try {
      const ctx = canvas.getContext("2d")
      if (!ctx) return null

      canvas.width = videoElement.videoWidth || 320
      canvas.height = videoElement.videoHeight || 240

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      return new Promise((resolve) => {
        mediaPipeRef.current.onResults((results: any) => {
          if (results.poseLandmarks && results.poseLandmarks.length > 0) {
            resolve({
              landmarks: results.poseLandmarks,
              timestamp: Date.now(),
              confidence: calculatePoseConfidence(results.poseLandmarks),
            })
          } else {
            resolve(null)
          }
        })

        mediaPipeRef.current.send({ image: imageData })
      })
    } catch (error) {
      console.error("[v0] Error analyzing pose:", error)
      return null
    }
  }

  const comparePoses = (instructorPose: PoseData, userPose: PoseData) => {
    const keyPoints = [
      { name: "left_shoulder", index: 11 },
      { name: "right_shoulder", index: 12 },
      { name: "left_elbow", index: 13 },
      { name: "right_elbow", index: 14 },
      { name: "left_wrist", index: 15 },
      { name: "right_wrist", index: 16 },
      { name: "left_hip", index: 23 },
      { name: "right_hip", index: 24 },
      { name: "left_knee", index: 25 },
      { name: "right_knee", index: 26 },
      { name: "left_ankle", index: 27 },
      { name: "right_ankle", index: 28 },
    ]

    let totalScore = 0
    const feedback = []
    let validComparisons = 0

    for (const point of keyPoints) {
      const instructorPoint = instructorPose.landmarks[point.index]
      const userPoint = userPose.landmarks[point.index]

      if (instructorPoint && userPoint && instructorPoint.visibility > 0.5 && userPoint.visibility > 0.5) {
        const angleDiff = calculateAngleDifference(instructorPoint, userPoint)
        const pointScore = Math.max(0, 100 - angleDiff * 2)

        totalScore += pointScore
        validComparisons++

        if (pointScore < 70) {
          feedback.push(generatePointFeedback(point.name, angleDiff))
        }
      }
    }

    const averageScore = validComparisons > 0 ? totalScore / validComparisons : 0

    let overallFeedback = ""
    if (averageScore >= 90) {
      overallFeedback = "Excellent form! Keep it up!"
    } else if (averageScore >= 75) {
      overallFeedback = "Good alignment. " + (feedback.length > 0 ? feedback[0] : "Minor adjustments needed.")
    } else if (averageScore >= 60) {
      overallFeedback = "Focus on alignment. " + feedback.slice(0, 2).join(" ")
    } else {
      overallFeedback = "Needs improvement. " + feedback.slice(0, 3).join(" ")
    }

    return {
      score: Math.round(averageScore),
      feedback: overallFeedback,
      detailedFeedback: feedback,
      keyPointScores: keyPoints.map((point) => ({
        name: point.name,
        score: calculatePointScore(instructorPose.landmarks[point.index], userPose.landmarks[point.index]),
      })),
    }
  }

  const calculatePoseConfidence = (landmarks: PoseLandmark[]): number => {
    const visibleLandmarks = landmarks.filter((landmark) => landmark.visibility && landmark.visibility > 0.5)
    return (visibleLandmarks.length / landmarks.length) * 100
  }

  const calculateAngleDifference = (point1: PoseLandmark, point2: PoseLandmark): number => {
    const dx = point1.x - point2.x
    const dy = point1.y - point2.y
    return Math.sqrt(dx * dx + dy * dy) * 100
  }

  const calculatePointScore = (instructorPoint: PoseLandmark, userPoint: PoseLandmark): number => {
    if (!instructorPoint || !userPoint) return 0
    const diff = calculateAngleDifference(instructorPoint, userPoint)
    return Math.max(0, 100 - diff * 2)
  }

  const generatePointFeedback = (pointName: string, angleDiff: number): string => {
    const bodyPart = pointName.replace("_", " ")
    if (angleDiff > 30) {
      return `Adjust your ${bodyPart} position significantly.`
    } else if (angleDiff > 15) {
      return `Fine-tune your ${bodyPart} alignment.`
    } else {
      return `Small adjustment needed for ${bodyPart}.`
    }
  }

  const detectPoseName = (pose: PoseData): string => {
    const landmarks = pose.landmarks

    const leftWrist = landmarks[15]
    const rightWrist = landmarks[16]
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]

    if (leftWrist && rightWrist && leftShoulder && rightShoulder) {
      if (leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y) {
        return "Arms Raised Pose"
      }
    }

    return "Unknown Pose"
  }

  const endSession = async () => {
    if (!sessionId || !sessionStartTime.current) return

    try {
      const sessionEndTime = new Date()
      const totalDuration = Math.floor((sessionEndTime.getTime() - sessionStartTime.current.getTime()) / 1000)

      const overallScore =
        poseAnalysisData.length > 0
          ? poseAnalysisData.reduce((sum, data) => sum + data.accuracy_score, 0) / poseAnalysisData.length
          : 0

      const reportData = generateSessionReport(poseAnalysisData, overallScore, totalDuration)

      await endAISession(sessionId, totalDuration, overallScore, reportData)

      onSessionComplete(reportData)
    } catch (error) {
      console.error("[v0] Error ending AI session:", error)
    }
  }

  const generateSessionReport = (analysisData: any[], overallScore: number, duration: number) => {
    const strengths = []
    const improvements = []
    const recommendations = []

    const highScoreCount = analysisData.filter((data) => data.accuracy_score >= 80).length
    const lowScoreCount = analysisData.filter((data) => data.accuracy_score < 60).length

    if (highScoreCount > analysisData.length * 0.7) {
      strengths.push("Excellent overall form and alignment")
      strengths.push("Consistent pose accuracy throughout session")
    }

    if (lowScoreCount > analysisData.length * 0.3) {
      improvements.push("Focus on maintaining proper alignment")
      improvements.push("Practice holding poses for longer duration")
    }

    if (activityType === "yoga") {
      recommendations.push("Continue practicing daily for best results")
      recommendations.push("Focus on breathing coordination with movements")
    }

    return {
      overallScore,
      duration,
      totalPoses: analysisData.length,
      averageAccuracy: overallScore,
      strengths,
      improvements,
      recommendations,
      progressNotes: `Session completed with ${Math.round(overallScore)}% accuracy over ${Math.floor(duration / 60)} minutes`,
      detailedAnalysis: analysisData,
    }
  }

  useEffect(() => {
    return () => {
      if (isActive && sessionId) {
        endSession()
      }
    }
  }, [])

  return (
    <>
      <canvas ref={instructorCanvasRef} style={{ display: "none" }} width={320} height={240} />
      <canvas ref={userCanvasRef} style={{ display: "none" }} width={320} height={240} />
    </>
  )
}
