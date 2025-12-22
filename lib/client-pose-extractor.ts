import type { PoseLandmarker } from "@mediapipe/tasks-vision"

export interface PoseFrame {
  timestamp: number
  landmarks: Array<{ x: number; y: number; z: number }>
  visibility: number[]
}

export class ClientPoseExtractor {
  private poseLandmarker: PoseLandmarker | null = null
  private initialized = false

  async initialize() {
    if (this.initialized) return

    if (typeof window === "undefined") {
      throw new Error("MediaPipe can only be initialized in browser environment")
    }

    try {
      const { PoseLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision")

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      )

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      })

      this.initialized = true
      console.log("[v0] MediaPipe initialized successfully")
    } catch (error) {
      console.error("[v0] MediaPipe initialization error:", error)
      throw new Error("Failed to initialize MediaPipe. Please ensure you're running in a browser environment.")
    }
  }

  async extractPosesFromVideo(videoFile: File, onProgress?: (percent: number) => void): Promise<PoseFrame[]> {
    try {
      await this.initialize()

      return new Promise((resolve, reject) => {
        const video = document.createElement("video")
        video.src = URL.createObjectURL(videoFile)
        video.muted = true
        video.playsInline = true // Added for mobile compatibility

        const poses: PoseFrame[] = []
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          const duration = video.duration
          const fps = 2 // Extract 2 poses per second
          const interval = 1 / fps
          let currentTime = 0

          const extractFrame = async () => {
            if (currentTime >= duration) {
              URL.revokeObjectURL(video.src)
              console.log(`[v0] Pose extraction complete: ${poses.length} frames`)
              resolve(poses)
              return
            }

            video.currentTime = currentTime

            video.onseeked = async () => {
              try {
                ctx.drawImage(video, 0, 0)

                // Detect pose at this frame
                const result = this.poseLandmarker!.detectForVideo(video, currentTime * 1000)

                if (result.landmarks && result.landmarks.length > 0) {
                  const landmarks = result.landmarks[0]
                  poses.push({
                    timestamp: currentTime,
                    landmarks: landmarks.map((l) => ({ x: l.x, y: l.y, z: l.z })),
                    visibility: landmarks.map((l) => l.visibility || 0),
                  })
                }

                // Update progress
                const progress = (currentTime / duration) * 100
                if (onProgress) onProgress(Math.round(progress))

                currentTime += interval
                extractFrame()
              } catch (error) {
                console.error("[v0] Frame extraction error:", error)
                // Continue to next frame even if one fails
                currentTime += interval
                extractFrame()
              }
            }
          }

          extractFrame()
        }

        video.onerror = (e) => {
          console.error("[v0] Video load error:", e)
          reject(new Error("Failed to load video file"))
        }
        video.load()
      })
    } catch (error) {
      console.error("[v0] extractPosesFromVideo error:", error)
      throw error
    }
  }

  comparePoses(userLandmarks: any[], instructorLandmarks: any[]): number {
    // Key joints for comparison (shoulders, elbows, wrists, hips, knees, ankles)
    const keyJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]

    let totalSimilarity = 0
    let validJoints = 0

    for (const jointIdx of keyJoints) {
      const userJoint = userLandmarks[jointIdx]
      const instructorJoint = instructorLandmarks[jointIdx]

      if (!userJoint || !instructorJoint) continue

      // Calculate Euclidean distance (normalized)
      const distance = Math.sqrt(
        Math.pow(userJoint.x - instructorJoint.x, 2) +
          Math.pow(userJoint.y - instructorJoint.y, 2) +
          Math.pow(userJoint.z - instructorJoint.z, 2),
      )

      // Convert distance to similarity (0-1 range, closer = higher)
      const similarity = Math.max(0, 1 - distance * 2)
      totalSimilarity += similarity
      validJoints++
    }

    return validJoints > 0 ? (totalSimilarity / validJoints) * 100 : 0
  }
}

export async function extractPosesFromVideo(
  videoFile: File,
  onProgress?: (percent: number) => void,
): Promise<PoseFrame[]> {
  const extractor = new ClientPoseExtractor()
  return extractor.extractPosesFromVideo(videoFile, onProgress)
}
