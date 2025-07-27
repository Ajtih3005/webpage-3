export class SessionWebSocket {
  private ws: WebSocket | null = null
  private sessionId: string
  private userId: string
  private username: string
  private role: "instructor" | "student"
  private onVideoSync?: (data: any) => void
  private onChatMessage?: (data: any) => void
  private onSessionState?: (data: any) => void
  private onParticipantUpdate?: (data: any) => void
  private onSessionAnalytics?: (data: any) => void

  constructor(sessionId: string, userId: string, username: string, role: "instructor" | "student") {
    this.sessionId = sessionId
    this.userId = userId
    this.username = username
    this.role = role
  }

  connect(websocketUrl: string) {
    this.ws = new WebSocket(websocketUrl)

    this.ws.onopen = () => {
      console.log("WebSocket connected")
      this.joinSession()
    }

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      this.handleMessage(message)
    }

    this.ws.onclose = () => {
      console.log("WebSocket disconnected")
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        this.connect(websocketUrl)
      }, 3000)
    }

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }
  }

  private joinSession() {
    this.send({
      type: "join_session",
      sessionId: this.sessionId,
      userId: this.userId,
      data: { role: this.role, username: this.username },
    })
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case "video_sync":
        if (this.onVideoSync) {
          this.onVideoSync(message.data)
        }
        break

      case "chat_message":
        if (this.onChatMessage) {
          this.onChatMessage(message.data)
        }
        break

      case "session_state":
        if (this.onSessionState) {
          this.onSessionState(message.data)
        }
        break

      case "participant_joined":
      case "participant_left":
        if (this.onParticipantUpdate) {
          this.onParticipantUpdate(message.data)
        }
        break

      case "session_analytics":
        if (this.onSessionAnalytics) {
          this.onSessionAnalytics(message.data)
        }
        break
    }
  }

  sendVideoControl(controlData: any) {
    this.send({
      type: "video_control",
      sessionId: this.sessionId,
      userId: this.userId,
      data: controlData,
    })
  }

  sendChatMessage(message: string) {
    this.send({
      type: "chat_message",
      sessionId: this.sessionId,
      userId: this.userId,
      data: { message, username: this.username },
    })
  }

  requestSessionAnalytics() {
    this.send({
      type: "get_session_analytics",
      sessionId: this.sessionId,
      userId: this.userId,
    })
  }

  onVideoSyncReceived(callback: (data: any) => void) {
    this.onVideoSync = callback
  }

  onChatMessageReceived(callback: (data: any) => void) {
    this.onChatMessage = callback
  }

  onSessionStateReceived(callback: (data: any) => void) {
    this.onSessionState = callback
  }

  onParticipantUpdateReceived(callback: (data: any) => void) {
    this.onParticipantUpdate = callback
  }

  onSessionAnalyticsReceived(callback: (data: any) => void) {
    this.onSessionAnalytics = callback
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
    }
  }
}
