"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Maximize, Minimize } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export default function ViewSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isFullscreen, setIsFullscreen] = useState(false)

  const playerRef = useRef<any>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }
  }, [])

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/user/login")
          return
        }

        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("*")
          .eq("id", sessionId)
          .single()

        if (courseError) throw courseError

        setSession(courseData)
        setLoading(false)

        if (courseData.youtube_link) {
          initializePlayer(courseData.youtube_link)
        }
      } catch (err: any) {
        console.error("[v0] Error fetching session:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchSession()
  }, [sessionId])

  const initializePlayer = (videoUrl: string) => {
    const videoId = getYouTubeVideoId(videoUrl)
    if (!videoId) {
      setError("Invalid YouTube URL")
      return
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player("youtube-player-replay", {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
          },
          events: {
            onReady: (event: any) => {
              console.log("[v0] YouTube player ready for replay")
            },
            onError: (event: any) => {
              console.error("[v0] YouTube player error:", event.data)
              setError("Failed to load video")
            },
          },
        })
      }
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading session...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <Button onClick={() => router.push("/user/previous-sessions")}>Back to Previous Sessions</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="bg-black/50 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button
            onClick={() => router.push("/user/previous-sessions")}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Previous Sessions
          </Button>
          <h1 className="text-white text-xl font-semibold">Previous Session Recording</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <Card className="mb-6 bg-white/5 border-white/10">
          <CardContent className="p-6">
            <h2 className="text-white text-2xl font-bold mb-2">{session?.title}</h2>
            <div className="flex items-center gap-4 text-gray-400">
              <span>📅 {formatDate(session?.scheduled_date)}</span>
            </div>
            {session?.description && <p className="text-gray-300 mt-4">{session.description}</p>}
          </CardContent>
        </Card>

        <div ref={videoContainerRef} className="relative rounded-lg overflow-hidden shadow-2xl bg-black">
          <div className="absolute top-4 right-4 z-20">
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="icon"
              className="bg-black/50 border-white/20 hover:bg-black/70"
            >
              {isFullscreen ? <Minimize className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}
            </Button>
          </div>

          <div className="relative aspect-video w-full">
            <div id="youtube-player-replay" className="absolute inset-0 w-full h-full"></div>
          </div>
        </div>

        <Card className="mt-6 bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <p className="text-blue-300 text-center">
              📼 This is a recording of a previous session. You can rewatch it anytime.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
