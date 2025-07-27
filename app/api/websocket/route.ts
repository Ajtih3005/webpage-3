import type { NextRequest } from "next/server"
import { WebSocketServer } from "ws"

// Global WebSocket server instance
let wss: WebSocketServer | null = null

// Session management
const sessions = new Map<
  string,
  {
    instructor: any
    students: Set<any>
    videoState: {
      isPlaying: boolean
      currentTime: number
      lastUpdate: number
    }
    chatMessages: Array<{
      id: string
      userId: string
      username: string
      message: string
      timestamp: number
    }>
  }
>()

export async function GET(request: NextRequest) {
  // Initialize WebSocket server if not exists
  if (!wss) {
    wss = new WebSocketServer({ port: 8080 })

    wss.on("connection", (ws, request) => {
      console.log("New WebSocket connection")

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString())
          handleWebSocketMessage(ws, message)
        } catch (error) {
          console.error("WebSocket message error:", error)
        }
      })

      ws.on("close", () => {
        console.log("WebSocket connection closed")
        cleanupUserFromSessions(ws)
      })
    })
  }

  return new Response("WebSocket server running on port 8080", { status: 200 })
}

function handleWebSocketMessage(ws: any, message: any) {
  const { type, sessionId, userId, data } = message

  switch (type) {
    case "join_session":
      joinSession(ws, sessionId, userId, data.role, data.username)
      break

    case "video_control":
      handleVideoControl(sessionId, userId, data)
      break

    case "chat_message":
      handleChatMessage(sessionId, userId, data)
      break

    case "get_session_analytics":
      handleSessionAnalytics(ws, sessionId)
      break
  }
}

function joinSession(ws: any, sessionId: string, userId: string, role: "instructor" | "student", username: string) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      instructor: null,
      students: new Set(),
      videoState: {
        isPlaying: false,
        currentTime: 0,
        lastUpdate: Date.now(),
      },
      chatMessages: [],
    })
  }

  const session = sessions.get(sessionId)!
  ws.sessionId = sessionId
  ws.userId = userId
  ws.username = username
  ws.role = role

  if (role === "instructor") {
    session.instructor = ws
  } else {
    session.students.add(ws)
  }

  // Send current video state and chat history to new joiner
  ws.send(
    JSON.stringify({
      type: "session_state",
      data: {
        videoState: session.videoState,
        chatMessages: session.chatMessages,
        participantCount: session.students.size + (session.instructor ? 1 : 0),
      },
    }),
  )

  // Notify others about new participant
  broadcastToSession(sessionId, {
    type: "participant_joined",
    data: { username, role, participantCount: session.students.size + (session.instructor ? 1 : 0) },
  })
}

function handleVideoControl(sessionId: string, userId: string, controlData: any) {
  const session = sessions.get(sessionId)
  if (!session) return

  // Only instructor can control video
  if (session.instructor?.userId !== userId) return

  // Update session video state
  session.videoState = {
    ...controlData,
    lastUpdate: Date.now(),
  }

  // Broadcast to all students
  broadcastToSession(sessionId, {
    type: "video_sync",
    data: controlData,
  })
}

function handleChatMessage(sessionId: string, userId: string, messageData: any) {
  const session = sessions.get(sessionId)
  if (!session) return

  const chatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    username: messageData.username,
    message: messageData.message,
    timestamp: Date.now(),
  }

  // Store message in session
  session.chatMessages.push(chatMessage)

  // Keep only last 100 messages
  if (session.chatMessages.length > 100) {
    session.chatMessages = session.chatMessages.slice(-100)
  }

  // Broadcast to all participants
  broadcastToSession(sessionId, {
    type: "chat_message",
    data: chatMessage,
  })
}

function handleSessionAnalytics(ws: any, sessionId: string) {
  const session = sessions.get(sessionId)
  if (!session) return

  const analytics = {
    participantCount: session.students.size + (session.instructor ? 1 : 0),
    studentCount: session.students.size,
    hasInstructor: !!session.instructor,
    videoState: session.videoState,
    messageCount: session.chatMessages.length,
    recentMessages: session.chatMessages.slice(-10),
    sessionDuration: Date.now() - (session.videoState.lastUpdate || Date.now()),
  }

  ws.send(
    JSON.stringify({
      type: "session_analytics",
      data: analytics,
    }),
  )
}

function broadcastToSession(sessionId: string, message: any) {
  const session = sessions.get(sessionId)
  if (!session) return

  const messageStr = JSON.stringify(message)

  if (session.instructor) {
    session.instructor.send(messageStr)
  }

  session.students.forEach((student) => {
    student.send(messageStr)
  })
}

function cleanupUserFromSessions(ws: any) {
  if (ws.sessionId && sessions.has(ws.sessionId)) {
    const session = sessions.get(ws.sessionId)!

    if (ws.role === "instructor") {
      session.instructor = null
    } else {
      session.students.delete(ws)
    }

    // Notify others about participant leaving
    broadcastToSession(ws.sessionId, {
      type: "participant_left",
      data: {
        username: ws.username,
        role: ws.role,
        participantCount: session.students.size + (session.instructor ? 1 : 0),
      },
    })

    // Clean up empty sessions
    if (!session.instructor && session.students.size === 0) {
      sessions.delete(ws.sessionId)
    }
  }
}
