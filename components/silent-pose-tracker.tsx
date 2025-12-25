"use client"

import { useEffect, useRef, useState } from "react"
import { ClientPoseExtractor } from "@/lib/client-pose-extractor"
import { analyzePoseQuality, calculateFormScore, type PoseAnalysisResult } from "@/lib/advanced-pose-analysis"
import type { NormalizedLandmark } from "@mediapipe/tasks-vision"

interface SilentPoseTrackerProps {
  userEmail: string
  courseId: string
  poseSessionId: string | null
  userVideoRef: HTMLVideoElement | null
  videoCurrentTime: number
  isActive: boolean
}

export function SilentPoseTracker({
  userEmail,
  courseId,
  poseSessionId,
  userVideoRef,
  videoCurrentTime,
  isActive,
}: SilentPoseTrackerProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [instructorPoses, setInstructorPoses] = useState<any[]>([])
  const extractorRef = useRef<ClientPoseExtractor | null>(null)
  const lastSendTime = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout>()
  const poseHistory = useRef<NormalizedLandmark[][]>([])
  const maxHistoryLength = 30 // Keep last 30 frames (~1 second at 30fps)

  useEffect(() => {
    if (!poseSessionId) return

    fetch(`/api/ai/instructor-poses?sessionId=${poseSessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.poses) {
          setInstructorPoses(data.poses)
          console.log("[v0] 📥 Loaded", data.poses.length, "instructor poses")
        }
      })
      .catch((err) => console.error("[v0] Failed to load instructor poses:", err))
  }, [poseSessionId])

  useEffect(() => {
    if (!isActive || !poseSessionId) return

    const extractor = new ClientPoseExtractor()
    extractor
      .initialize()
      .then(() => {
        console.log("[v0] 🎯 Silent pose tracking initialized with advanced CV analysis")
        extractorRef.current = extractor
        setIsInitialized(true)
      })
      .catch((err) => console.error("[v0] Pose tracking init failed:", err))

    return () => {
      extractorRef.current = null
      poseHistory.current = []
    }
  }, [isActive, poseSessionId])

  useEffect(() => {
    if (!isInitialized || !isActive || !userVideoRef || instructorPoses.length === 0) return

    const trackPoses = async () => {
      const now = performance.now()

      // Send comparison data every 2 seconds
      if (now - lastSendTime.current < 2000) return

      try {
        const currentTimeMs = videoCurrentTime * 1000

        const instructorPose = instructorPoses.reduce((prev, curr) => {
          return Math.abs(curr.timestamp_ms - currentTimeMs) < Math.abs(prev.timestamp_ms - currentTimeMs) ? curr : prev
        })

        if (!instructorPose || !extractorRef.current) return

        // TODO: This requires actual webcam feed integration
        // For now, simulating with placeholder
        const userLandmarks = await extractorRef.current.extractPoseFromVideo(userVideoRef)

        if (!userLandmarks || userLandmarks.length === 0) {
          console.log("[v0] ⚠️ No user pose detected")
          return
        }

        poseHistory.current.push(userLandmarks)
        if (poseHistory.current.length > maxHistoryLength) {
          poseHistory.current.shift()
        }

        const analysis: PoseAnalysisResult = analyzePoseQuality(
          instructorPose.pose_landmarks,
          userLandmarks,
          poseHistory.current.slice(-10), // Last 10 frames for motion analysis
        )

        const formScore = calculateFormScore(analysis)

        console.log("[v0] 📊 Advanced Analysis:", {
          timestamp: currentTimeMs,
          overallAccuracy: analysis.overallAccuracy.toFixed(1),
          formScore: formScore.toFixed(1),
          velocity: analysis.velocityScore.toFixed(1),
          stability: analysis.stabilityScore.toFixed(1),
          detectedPose: analysis.detectedPose,
        })

        await fetch("/api/pose-tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_email: userEmail,
            course_id: courseId,
            video_timestamp_ms: currentTimeMs,
            overall_accuracy: analysis.overallAccuracy,
            form_score: formScore,
            joint_accuracies: analysis.jointAccuracies,
            velocity_score: analysis.velocityScore,
            stability_score: analysis.stabilityScore,
            transition_quality: analysis.transitionQuality,
            detected_pose: analysis.detectedPose,
            feedback: analysis.formFeedback,
          }),
        })

        lastSendTime.current = now
      } catch (error) {
        console.error("[v0] Pose comparison error:", error)
      }
    }

    intervalRef.current = setInterval(trackPoses, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isInitialized, isActive, userVideoRef, instructorPoses, videoCurrentTime, userEmail, courseId])

  return null // No UI rendered - completely silent
}
