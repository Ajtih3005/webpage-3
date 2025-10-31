"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, CameraOff, Brain, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import AIAnalysisEngine from "@/components/ai-analysis-engine"

interface AIEnhancedPlayerProps {
  courseId: string
  userId: number
  youtubeVideoId: string
  activityType: string
}

export default function AIEnhancedPlayer({ courseId, userId, youtubeVideoId, activityType }: AIEnhancedPlayerProps) {
  const [cameraActive, setCameraActive] = useState(false)
  const [currentFeedback, setCurrentFeedback] = useState("")
  const [currentScore, setCurrentScore] = useState(0)
  const [sessionReport, setSessionReport] = useState<any>(null)
  const [showReport, setShowReport] = useState(false)

  const instructorVideoRef = useRef<HTMLVideoElement>(null)
  const userVideoRef = useRef<HTMLVideoElement>(null)
  const youtubePlayerRef = useRef<any>(null)

  useEffect(() => {
    if (window.YT && youtubeVideoId) {
      initializeYouTubePlayer()
    }
  }, [youtubeVideoId])

  const initializeYouTubePlayer = () => {
    youtubePlayerRef.current = new window.YT.Player("ai-youtube-player", {
      videoId: youtubeVideoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onReady: (event) => {
          console.log("[v0] AI-enhanced YouTube player ready")

          const iframe = event.target.getIframe()
          if (iframe && instructorVideoRef.current) {
            instructorVideoRef.current.src = iframe.src
          }
        },
        onStateChange: (event) => {
          console.log("[v0] YouTube player state changed:", event.data)
        },
      },
    })
  }

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      })

      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream
        userVideoRef.current.play()
      }

      setCameraActive(true)
      console.log("[v0] Camera started - AI analysis automatically enabled")
    } catch (error) {
      console.error("[v0] Error starting camera:", error)
    }
  }

  const handleStopCamera = () => {
    if (userVideoRef.current && userVideoRef.current.srcObject) {
      const stream = userVideoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      userVideoRef.current.srcObject = null
    }

    setCameraActive(false)
    console.log("[v0] Camera stopped - AI analysis automatically disabled")
  }

  const handleAIFeedback = (feedback: string, score: number) => {
    setCurrentFeedback(feedback)
    setCurrentScore(score)
  }

  const handleSessionComplete = (reportData: any) => {
    setSessionReport(reportData)
    setShowReport(true)
    setCameraActive(false)
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute inset-0">
        <div id="ai-youtube-player" className="w-full h-full"></div>
      </div>

      {cameraActive && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <Card className="bg-black/80 border-green-500/50 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Brain className="w-4 h-4 text-green-400" />
                AI Analysis Active
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs">Score:</span>
                  <span className="text-green-400 font-bold">{currentScore}%</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Progress value={currentScore} className="mb-2" />
              <p className="text-xs text-green-300">{currentFeedback}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {cameraActive && (
        <div className="absolute bottom-4 right-4 z-20">
          <div className="relative">
            <video
              ref={userVideoRef}
              className="w-48 h-36 rounded-lg border-2 border-green-500/50 bg-black"
              autoPlay
              muted
              playsInline
            />
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">LIVE</div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-20 flex gap-2">
        {!cameraActive ? (
          <Button onClick={handleStartCamera} className="bg-green-600 hover:bg-green-700 text-white">
            <Camera className="w-4 h-4 mr-2" />
            Turn On Camera
          </Button>
        ) : (
          <Button onClick={handleStopCamera} className="bg-red-600 hover:bg-red-700 text-white">
            <CameraOff className="w-4 h-4 mr-2" />
            Turn Off Camera
          </Button>
        )}
      </div>

      {showReport && sessionReport && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-30 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                AI Analysis Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{sessionReport.overallScore}%</div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">{Math.floor(sessionReport.duration / 60)}m</div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-green-600 mb-2">Strengths</h3>
                <ul className="list-disc list-inside space-y-1">
                  {sessionReport.strengths.map((strength: string, index: number) => (
                    <li key={index} className="text-sm">
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-orange-600 mb-2">Areas for Improvement</h3>
                <ul className="list-disc list-inside space-y-1">
                  {sessionReport.improvements.map((improvement: string, index: number) => (
                    <li key={index} className="text-sm">
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-blue-600 mb-2">Recommendations</h3>
                <ul className="list-disc list-inside space-y-1">
                  {sessionReport.recommendations.map((recommendation: string, index: number) => (
                    <li key={index} className="text-sm">
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowReport(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    console.log("[v0] Downloading report:", sessionReport)
                  }}
                >
                  Download Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <video ref={instructorVideoRef} style={{ display: "none" }} crossOrigin="anonymous" />

      <AIAnalysisEngine
        isActive={cameraActive}
        instructorVideoElement={instructorVideoRef.current}
        userVideoElement={userVideoRef.current}
        courseId={courseId}
        userId={userId}
        activityType={activityType}
        onFeedback={handleAIFeedback}
        onSessionComplete={handleSessionComplete}
      />
    </div>
  )
}
