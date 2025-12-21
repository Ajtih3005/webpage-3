import type { NormalizedLandmark } from "@mediapipe/tasks-vision"

export interface PoseAnalysisResult {
  overallAccuracy: number
  jointAccuracies: Record<string, number>
  velocityScore: number
  stabilityScore: number
  transitionQuality: number
  formFeedback: string[]
  detectedPose: string
}

export interface MotionMetrics {
  velocity: number
  acceleration: number
  smoothness: number
  stability: number
}

// Dynamic Time Warping for temporal alignment
export function calculateDTW(instructorSequence: number[][], userSequence: number[][]): number {
  const n = instructorSequence.length
  const m = userSequence.length
  const dtw: number[][] = Array(n + 1)
    .fill(0)
    .map(() => Array(m + 1).fill(Number.POSITIVE_INFINITY))

  dtw[0][0] = 0

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = euclideanDistance(instructorSequence[i - 1], userSequence[j - 1])
      dtw[i][j] = cost + Math.min(dtw[i - 1][j], dtw[i][j - 1], dtw[i - 1][j - 1])
    }
  }

  return dtw[n][m] / Math.max(n, m)
}

function euclideanDistance(point1: number[], point2: number[]): number {
  return Math.sqrt(point1.reduce((sum, val, idx) => sum + Math.pow(val - point2[idx], 2), 0))
}

// Analyze motion trajectory
export function analyzeTrajectory(landmarks: NormalizedLandmark[][], jointIndex: number): MotionMetrics {
  if (landmarks.length < 3) {
    return { velocity: 0, acceleration: 0, smoothness: 0, stability: 0 }
  }

  const positions = landmarks.map((frame) => frame[jointIndex])
  const velocities: number[] = []
  const accelerations: number[] = []

  // Calculate velocity
  for (let i = 1; i < positions.length; i++) {
    const dx = positions[i].x - positions[i - 1].x
    const dy = positions[i].y - positions[i - 1].y
    const dz = (positions[i].z || 0) - (positions[i - 1].z || 0)
    velocities.push(Math.sqrt(dx * dx + dy * dy + dz * dz))
  }

  // Calculate acceleration
  for (let i = 1; i < velocities.length; i++) {
    accelerations.push(Math.abs(velocities[i] - velocities[i - 1]))
  }

  const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length
  const avgAcceleration = accelerations.reduce((a, b) => a + b, 0) / accelerations.length

  // Smoothness: low variance in velocity
  const velocityVariance = velocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) / velocities.length
  const smoothness = Math.max(0, 100 - velocityVariance * 1000)

  // Stability: low overall movement
  const totalMovement = velocities.reduce((a, b) => a + b, 0)
  const stability = Math.max(0, 100 - totalMovement * 100)

  return {
    velocity: avgVelocity,
    acceleration: avgAcceleration,
    smoothness: Math.min(100, smoothness),
    stability: Math.min(100, stability),
  }
}

// Detect pose transitions
export function detectPoseTransition(
  currentPose: NormalizedLandmark[],
  previousPose: NormalizedLandmark[],
  threshold = 0.15,
): boolean {
  if (!previousPose || previousPose.length === 0) return false

  let totalChange = 0
  const keyJoints = [11, 12, 13, 14, 23, 24, 25, 26] // shoulders, elbows, hips, knees

  for (const jointIdx of keyJoints) {
    const curr = currentPose[jointIdx]
    const prev = previousPose[jointIdx]
    const dx = curr.x - prev.x
    const dy = curr.y - prev.y
    totalChange += Math.sqrt(dx * dx + dy * dy)
  }

  return totalChange / keyJoints.length > threshold
}

// Calculate joint angle
export function calculateAngle(
  point1: NormalizedLandmark,
  point2: NormalizedLandmark,
  point3: NormalizedLandmark,
): number {
  const vector1 = {
    x: point1.x - point2.x,
    y: point1.y - point2.y,
  }
  const vector2 = {
    x: point3.x - point2.x,
    y: point3.y - point2.y,
  }

  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y
  const magnitude1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2)
  const magnitude2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2)

  const angle = Math.acos(dotProduct / (magnitude1 * magnitude2))
  return (angle * 180) / Math.PI
}

// Comprehensive pose analysis
export function analyzePoseQuality(
  instructorPose: NormalizedLandmark[],
  userPose: NormalizedLandmark[],
  previousUserPoses: NormalizedLandmark[][] = [],
): PoseAnalysisResult {
  const jointPairs = {
    leftElbow: { points: [11, 13, 15], name: "Left Elbow" },
    rightElbow: { points: [12, 14, 16], name: "Right Elbow" },
    leftKnee: { points: [23, 25, 27], name: "Left Knee" },
    rightKnee: { points: [24, 26, 28], name: "Right Knee" },
    leftShoulder: { points: [13, 11, 23], name: "Left Shoulder" },
    rightShoulder: { points: [14, 12, 24], name: "Right Shoulder" },
    leftHip: { points: [11, 23, 25], name: "Left Hip" },
    rightHip: { points: [12, 24, 26], name: "Right Hip" },
  }

  const jointAccuracies: Record<string, number> = {}
  let totalAccuracy = 0
  const feedback: string[] = []

  // Analyze each joint
  for (const [key, joint] of Object.entries(jointPairs)) {
    const instructorAngle = calculateAngle(
      instructorPose[joint.points[0]],
      instructorPose[joint.points[1]],
      instructorPose[joint.points[2]],
    )

    const userAngle = calculateAngle(userPose[joint.points[0]], userPose[joint.points[1]], userPose[joint.points[2]])

    const angleDiff = Math.abs(instructorAngle - userAngle)
    const accuracy = Math.max(0, 100 - angleDiff * 2)
    jointAccuracies[key] = accuracy
    totalAccuracy += accuracy

    if (accuracy < 70) {
      feedback.push(`${joint.name}: ${angleDiff > 0 ? "Adjust angle" : "Good"} (${accuracy.toFixed(0)}%)`)
    }
  }

  const overallAccuracy = totalAccuracy / Object.keys(jointPairs).length

  // Motion analysis if we have history
  let velocityScore = 100
  let stabilityScore = 100
  let transitionQuality = 100

  if (previousUserPoses.length > 0) {
    const metrics = analyzeTrajectory(
      [...previousUserPoses, userPose],
      13, // Right elbow as reference
    )
    velocityScore = 100 - Math.min(100, metrics.velocity * 500)
    stabilityScore = metrics.stability
    transitionQuality = metrics.smoothness
  }

  // Detect pose type (basic classification)
  const detectedPose = classifyPose(userPose)

  return {
    overallAccuracy,
    jointAccuracies,
    velocityScore,
    stabilityScore,
    transitionQuality,
    formFeedback: feedback,
    detectedPose,
  }
}

// Basic pose classification
function classifyPose(pose: NormalizedLandmark[]): string {
  const leftHip = pose[23]
  const rightHip = pose[24]
  const leftShoulder = pose[11]
  const rightShoulder = pose[12]
  const leftKnee = pose[25]
  const rightKnee = pose[26]

  const hipMidpoint = (leftHip.y + rightHip.y) / 2
  const shoulderMidpoint = (leftShoulder.y + rightShoulder.y) / 2
  const kneeMidpoint = (leftKnee.y + rightKnee.y) / 2

  // Standing
  if (hipMidpoint < 0.7 && kneeMidpoint > 0.8) {
    return "Standing"
  }

  // Seated
  if (hipMidpoint > 0.6 && kneeMidpoint > 0.7) {
    return "Seated"
  }

  // Plank/Prone
  if (Math.abs(shoulderMidpoint - hipMidpoint) < 0.1) {
    return "Plank/Horizontal"
  }

  // Squat/Lunge
  if (hipMidpoint > 0.5 && kneeMidpoint > 0.7) {
    return "Squat/Lunge"
  }

  return "Unknown"
}

// Calculate overall form score with weighted components
export function calculateFormScore(analysis: PoseAnalysisResult): number {
  const weights = {
    accuracy: 0.5,
    velocity: 0.15,
    stability: 0.2,
    transition: 0.15,
  }

  return (
    analysis.overallAccuracy * weights.accuracy +
    analysis.velocityScore * weights.velocity +
    analysis.stabilityScore * weights.stability +
    analysis.transitionQuality * weights.transition
  )
}
