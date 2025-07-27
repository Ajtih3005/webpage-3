"use client"

import { useEffect, useState } from "react"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SessionWebSocket } from "@/lib/websocket-client"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Users, MessageSquare, Play, Pause, Eye, Clock, Activity, TrendingUp, RefreshCw } from "lucide-react"

interface LiveSession {
  id: string
  course_id: number
  instructor_id: number
  status: string
  created_at: string
  course: {
    title: string
    youtube_link: string
  }
  instructor: {
    name: string
    email: string
  }
}

interface SessionAnalytics {
  participantCount: number
  studentCount: number
  hasInstructor: boolean
  videoState: {
    isPlaying: boolean
    currentTime: number
    lastUpdate: number
  }
  messageCount: number
  recentMessages: Array<{
    username: string
    message: string
    timestamp: number
  }>
  sessionDuration: number
}

export default function LiveSessionsAdmin() {
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null)
  const [socket, setSocket] = useState<SessionWebSocket | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLiveSessions()

    // Refresh every 30 seconds
    const interval = setInterval(fetchLiveSessions, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedSession) {
      connectToSession(selectedSession)
    }

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [selectedSession])

  const fetchLiveSessions = async () => {
    try {
      const supabase = getSupabaseBrowserClient()

      const { data: sessions, error } = await supabase
        .from("live_sessions")
        .select(`
          id,
          course_id,
          instructor_id,
          status,
          created_at,
          courses (
            title,
            youtube_link
          ),
          users (
            name,
            email
          )
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (error) throw error

      setLiveSessions(sessions || [])
    } catch (error) {
      console.error("Error fetching live sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const connectToSession = (sessionId: string) => {
    if (socket) {
      socket.disconnect()
    }

    const ws = new SessionWebSocket(sessionId, "admin", "Admin", "instructor")

    ws.onSessionAnalyticsReceived((data) => {
      setAnalytics(data)
    })

    ws.connect("ws://localhost:8080")
    setSocket(ws)

    // Request analytics immediately and then every 5 seconds
    setTimeout(() => {
      ws.requestSessionAnalytics()
    }, 1000)

    const analyticsInterval = setInterval(() => {
      ws.requestSessionAnalytics()
    }, 5000)

    return () => clearInterval(analyticsInterval)
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const formatVideoTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Live Session Analytics</h1>
          <Button onClick={fetchLiveSessions} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Sessions List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Active Sessions ({liveSessions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading sessions...</p>
                      </div>
                    ) : liveSessions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No active sessions</p>
                      </div>
                    ) : (
                      liveSessions.map((session) => (
                        <div
                          key={session.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedSession === session.id
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedSession(session.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-sm">{session.course.title}</h3>
                            <Badge className="bg-green-100 text-green-800">LIVE</Badge>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">Instructor: {session.instructor.name}</p>
                          <p className="text-xs text-gray-500">
                            Started: {new Date(session.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Session Analytics */}
          <div className="lg:col-span-2">
            {selectedSession && analytics ? (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-500" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-500">Participants</p>
                          <p className="text-2xl font-bold">{analytics.participantCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <MessageSquare className="h-8 w-8 text-green-500" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-500">Messages</p>
                          <p className="text-2xl font-bold">{analytics.messageCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <Clock className="h-8 w-8 text-purple-500" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-500">Duration</p>
                          <p className="text-2xl font-bold">{formatDuration(analytics.sessionDuration)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        {analytics.videoState.isPlaying ? (
                          <Play className="h-8 w-8 text-red-500" />
                        ) : (
                          <Pause className="h-8 w-8 text-gray-500" />
                        )}
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-500">Video Status</p>
                          <p className="text-lg font-bold">{analytics.videoState.isPlaying ? "Playing" : "Paused"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Video State */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Eye className="h-5 w-5 mr-2" />
                      Video State
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-700 mb-2">Current Time</h3>
                        <p className="text-2xl font-bold">{formatVideoTime(analytics.videoState.currentTime)}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-700 mb-2">Status</h3>
                        <div className="flex items-center">
                          <div
                            className={`w-3 h-3 rounded-full mr-2 ${
                              analytics.videoState.isPlaying ? "bg-green-500" : "bg-gray-400"
                            }`}
                          ></div>
                          <p className="text-lg font-medium">{analytics.videoState.isPlaying ? "Playing" : "Paused"}</p>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-700 mb-2">Last Update</h3>
                        <p className="text-sm">{new Date(analytics.videoState.lastUpdate).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Chat Messages */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Recent Chat Messages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {analytics.recentMessages.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">No messages yet</p>
                        ) : (
                          analytics.recentMessages.map((message, index) => (
                            <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {message.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-blue-600">{message.username}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{message.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Live Session</h3>
                  <p className="text-gray-500">
                    Choose a session from the list to view real-time analytics and chat activity.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
