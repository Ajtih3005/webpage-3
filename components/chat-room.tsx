"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Send, Pin, Trash2, Users, MessageCircle, ExternalLink, Megaphone } from "lucide-react"
import {
  type ChatMessage,
  getChatMessages,
  sendChatMessage,
  togglePinMessage,
  deleteChatMessage,
  getCourseInfo,
  subscribeToChatRoom,
} from "@/lib/chat-room-utils"

interface ChatRoomProps {
  courseId: number
  userId: string
  userName: string
  userType: "student" | "instructor" | "admin"
}

export default function ChatRoomComponent({ courseId, userId, userName, userType }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [courseInfo, setCourseInfo] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Load initial data
  useEffect(() => {
    const loadChatData = async () => {
      setIsLoading(true)

      // Load course info and messages in parallel
      const [courseData, messagesData] = await Promise.all([getCourseInfo(courseId), getChatMessages(courseId)])

      setCourseInfo(courseData)
      setMessages(messagesData)
      setIsLoading(false)

      // Scroll to bottom after loading
      setTimeout(scrollToBottom, 100)
    }

    loadChatData()
  }, [courseId])

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = subscribeToChatRoom(courseId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage])
      setTimeout(scrollToBottom, 100)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [courseId])

  // Handle sending messages
  const handleSendMessage = async (messageType: "text" | "link" | "announcement" = "text") => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    const success = await sendChatMessage(courseId, userId, userName, userType, newMessage, messageType)

    if (success) {
      setNewMessage("")
    }
    setIsSending(false)
  }

  // Handle pin/unpin message
  const handleTogglePin = async (messageId: string, currentPinStatus: boolean) => {
    if (userType === "student") return

    const success = await togglePinMessage(messageId, !currentPinStatus)
    if (success) {
      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, is_pinned: !currentPinStatus } : msg)))
    }
  }

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (userType === "student") return

    const success = await deleteChatMessage(messageId)
    if (success) {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
    }
  }

  // Get message icon based on type
  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case "link":
        return <ExternalLink className="h-3 w-3" />
      case "announcement":
        return <Megaphone className="h-3 w-3" />
      default:
        return <MessageCircle className="h-3 w-3" />
    }
  }

  // Get user type badge color
  const getUserBadgeColor = (type: string) => {
    switch (type) {
      case "admin":
        return "bg-red-500 hover:bg-red-600"
      case "instructor":
        return "bg-blue-500 hover:bg-blue-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading chat room...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="w-full h-[600px] flex flex-col">
      {/* Chat Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              {courseInfo?.course_title || "Chat Room"}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Batch {courseInfo?.batch_number} • {courseInfo?.subscription_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{messages.length > 0 ? "Active" : "No messages"}</span>
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* Messages Area */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pinned Messages */}
              {messages
                .filter((msg) => msg.is_pinned)
                .map((message) => (
                  <div key={`pinned-${message.id}`} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Pin className="h-3 w-3 text-yellow-600" />
                          <Badge variant="outline" className={`text-xs ${getUserBadgeColor(message.user_type)}`}>
                            {message.user_type}
                          </Badge>
                          <span className="font-medium text-sm">{message.user_name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                      {userType !== "student" && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTogglePin(message.id, message.is_pinned)}
                            className="h-6 w-6 p-0"
                          >
                            <Pin className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteMessage(message.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

              {/* Regular Messages */}
              {messages
                .filter((msg) => !msg.is_pinned)
                .map((message) => (
                  <div key={message.id} className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getMessageIcon(message.message_type)}
                        <Badge variant="outline" className={`text-xs ${getUserBadgeColor(message.user_type)}`}>
                          {message.user_type}
                        </Badge>
                        <span className="font-medium text-sm">{message.user_name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          message.message_type === "announcement"
                            ? "font-medium text-blue-700 bg-blue-50 p-2 rounded"
                            : ""
                        }`}
                      >
                        {message.message}
                      </p>
                    </div>
                    {userType !== "student" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTogglePin(message.id, message.is_pinned)}
                          className="h-6 w-6 p-0"
                        >
                          <Pin className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMessage(message.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>

      <Separator />

      {/* Message Input */}
      <div className="p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={isSending}
          />
          <Button onClick={() => handleSendMessage()} disabled={!newMessage.trim() || isSending} size="sm">
            <Send className="h-4 w-4" />
          </Button>
          {userType !== "student" && (
            <Button
              onClick={() => handleSendMessage("announcement")}
              disabled={!newMessage.trim() || isSending}
              size="sm"
              variant="outline"
            >
              <Megaphone className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Press Enter to send • {userType !== "student" ? "Use megaphone for announcements" : ""}
        </p>
      </div>
    </Card>
  )
}
