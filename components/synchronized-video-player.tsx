"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { SessionWebSocket } from "@/lib/websocket-client"
import { extractYoutubeVideoId } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, MessageSquare, Send, Play, Pause } from "lucide-react"

interface SynchronizedVideoPlayerProps {
  courseId: string
  sessionId: string
  userId: string
  username: string
  role: "instructor" | "student"
  youtubeUrl: string
  courseTitle: string
}

interface ChatMessage {
  id: string
  userId: string
  username: string
  message: string
  timestamp: number
}

export default function SynchronizedVideoPlayer({
  courseId,
  sessionId,
  userId,
  username,
  role,
  youtubeUrl,
  courseTitle,
}: SynchronizedVideoPlayerProps) {
  const router = useRouter()
  const [socket, setSocket] = useState<SessionWebSocket | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [participantCount, setParticipantCount] = useState(0)
  const [videoState, setVideoState] = useState({
    isPlaying: false,
    currentTime: 0,
    lastUpdate: Date.now(),
  })
  const [showChat, setShowChat] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  const youtubePlayer = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement | null>(null)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)
  const youtubeVideoId = extractYoutubeVideoId(youtubeUrl)

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new SessionWebSocket(sessionId, userId, username, role)

    ws.onSessionStateReceived((data) => {
      setVideoState(data.videoState)
      setChatMessages(data.chatMessages)
      setParticipantCount(data.participantCount)
      setIsConnected(true)
    })

    ws.onVideoSyncReceived((data) => {
      setVideoState(data)
      syncVideoPlayer(data)
    })

    ws.onChatMessageReceived((message) => {
      setChatMessages((prev) => [...prev, message])
      scrollChatToBottom()
    })

    ws.onParticipantUpdateReceived((data) => {
      setParticipantCount(data.participantCount)
    })

    ws.connect("ws://localhost:8080")
    setSocket(ws)

    return () => {
      ws.disconnect()
    }
  }, [sessionId, userId, username, role])

  useEffect(() => {
    // Load YouTube API
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        initializeYouTubePlayer()
      }
    } else {
      initializeYouTubePlayer()
    }
  }, [youtubeVideoId])

  const initializeYouTubePlayer = () => {
    if (!window.YT || !window.YT.Player || !playerContainerRef.current || !youtubeVideoId) {
      return
    }

    const playerDiv = document.createElement("div")
    playerDiv.id = "youtube-player"
    playerDiv.style.width = "100%"
    playerDiv.style.height = "100%"

    if (playerContainerRef.current) {
      playerContainerRef.current.innerHTML = ""
      playerContainerRef.current.appendChild(playerDiv)
    }

    youtubePlayer.current = new window.YT.Player("youtube-player", {
      videoId: youtubeVideoId,
      playerVars: {
        autoplay: 0,
        controls: role === "instructor" ? 1 : 0, // Only instructor gets controls
        disablekb: role === "student" ? 1 : 0,
        fs: 0,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        cc_load_policy: 0,
        playsinline: 1,
      },
      events: {
        onReady: (event) => {
          console.log("YouTube player ready")
          // Sync with current video state
          if (videoState.currentTime > 0) {
            event.target.seekTo(videoState.currentTime, true)
          }
          if (videoState.isPlaying) {
            event.target.playVideo()
          }
        },
        onStateChange: (event) => {
          if (role === "instructor") {
            handleInstructorVideoStateChange(event)
          }
        },
      },
    })
  }

  const handleInstructorVideoStateChange = (event: any) => {
    const player = event.target
    const currentTime = player.getCurrentTime()
    const isPlaying = event.data === 1 // YT.PlayerState.PLAYING

    const newVideoState = {
      isPlaying,
      currentTime,
      lastUpdate: Date.now(),
    }

    setVideoState(newVideoState)
    socket?.sendVideoControl(newVideoState)
  }

  const syncVideoPlayer = (data: any) => {
    if (!youtubePlayer.current) return

    const timeDiff = Math.abs(youtubePlayer.current.getCurrentTime() - data.currentTime)

    // Sync if time difference is more than 2 seconds
    if (timeDiff > 2) {
      youtubePlayer.current.seekTo(data.currentTime, true)
    }

    if (data.isPlaying) {
      youtubePlayer.current.playVideo()
    } else {
      youtubePlayer.current.pauseVideo()
    }
  }

  const handleSendMessage = () => {
    if (newMessage.trim() && socket) {
      socket.sendChatMessage(newMessage.trim())
      setNewMessage("")
    }
  }

  const scrollChatToBottom = () => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
      }
    }, 100)
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="fixed inset-0 bg-black flex">
      {/* Video Player Section */}
      <div className={`flex-1 flex flex-col ${showChat ? "mr-80" : ""}`}>
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/user/access-course")}
              className="text-white hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Exit
            </Button>
            <h1 className="text-lg font-semibold">{courseTitle}</h1>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Connecting..."}
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <Users className="h-4 w-4" />
              <span>{participantCount} participants</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className="text-white hover:bg-gray-700"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Video Container */}
        <div className="flex-1 relative bg-black">
          <div ref={playerContainerRef} className="absolute inset-0 w-full h-full" />

          {/* Video Controls Overlay (Instructor Only) */}
          {role === "instructor" && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded-lg p-3">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-red-600">INSTRUCTOR</Badge>
                  <span className="text-sm">You control the video for all participants</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (videoState.isPlaying) {
                        youtubePlayer.current?.pauseVideo()
                      } else {
                        youtubePlayer.current?.playVideo()
                      }
                    }}
                    className="text-white hover:bg-white/20"
                  >
                    {videoState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Student View Indicator */}
          {role === "student" && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-blue-600">STUDENT VIEW</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="w-80 bg-gray-900 text-white flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Live Chat</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChat(false)}
                className="text-white hover:bg-gray-700"
              >
                ×
              </Button>
            </div>
            <p className="text-sm text-gray-400 mt-1">{participantCount} participants online</p>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
            <div className="space-y-3">
              {chatMessages.map((message) => (
                <div key={message.id} className="group">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                      {message.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-blue-400">{message.username}</span>
                        <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-200 mt-1 break-words">{message.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage()
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
