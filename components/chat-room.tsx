"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Send,
  Users,
  Pin,
  Trash2,
  MessageCircle,
  Crown,
  GraduationCap,
  User,
  ExternalLink,
  Megaphone,
} from "lucide-react"
import {
  getChatRoomInfo,
  getChatMessages,
  sendChatMessage,
  subscribeToChatRoom,
  toggleMessagePin,
  deleteChatMessage,
  type ChatMessage,
  type ChatRoomInfo,
} from "@/lib/chat-room-utils"

interface ChatRoomProps {
  courseId: number
  userId: string
  userName: string
  userType: "student" | "instructor" | "admin"
  className?: string
}

export default function ChatRoomComponent({ courseId, userId, userName, userType, className = "" }: ChatRoomProps) {
  const [chatRoom, setChatRoom] = useState<ChatRoomInfo | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<any>(null)

  // Load chat room and messages
  useEffect(() => {
    loadChatRoom()
    loadMessages()

    // Subscribe to real-time updates
    subscriptionRef.current = subscribeToChatRoom(courseId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage])
    })

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [courseId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatRoom = async () => {
    const roomInfo = await getChatRoomInfo(courseId)
    setChatRoom(roomInfo)
  }

  const loadMessages = async () => {
    setIsLoading(true)
    const chatMessages = await getChatMessages(courseId)
    setMessages(chatMessages)
    setIsLoading(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || isSending) return

    setIsSending(true)

    // Determine message type
    const messageType = newMessage.includes("http") ? "link" : "text"

    const success = await sendChatMessage(courseId, userId, userName, userType, newMessage, messageType)

    if (success) {
      setNewMessage("")
    }

    setIsSending(false)
  }

  const handlePinMessage = async (messageId: string, isPinned: boolean) => {
    await toggleMessagePin(messageId, !isPinned, userType)
    // Reload messages to reflect changes
    loadMessages()
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      await deleteChatMessage(messageId, userType)
      // Reload messages to reflect changes
      loadMessages()
    }
  }

  const getUserIcon = (type: string) => {
    switch (type) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-500" />
      case "instructor":
        return <GraduationCap className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getUserBadgeColor = (type: string) => {
    switch (type) {
      case "admin":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "instructor":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderMessage = (message: ChatMessage) => {
    const isLink = message.message_type === "link"
    const isAnnouncement = message.message_type === "announcement"

    return (
      <div
        key={message.id}
        className={`flex flex-col space-y-2 p-3 rounded-lg transition-colors ${
          message.is_pinned ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50 hover:bg-gray-100"
        } ${isAnnouncement ? "bg-blue-50 border border-blue-200" : ""}`}
      >
        {/* Message Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getUserIcon(message.user_type)}
            <Badge className={`text-xs ${getUserBadgeColor(message.user_type)}`}>{message.user_name}</Badge>
            <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
            {message.is_pinned && <Pin className="h-3 w-3 text-yellow-500" />}
            {isAnnouncement && <Megaphone className="h-3 w-3 text-blue-500" />}
          </div>

          {/* Message Actions */}
          <div className="flex items-center space-x-1">
            {(userType === "admin" || userType === "instructor") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePinMessage(message.id, message.is_pinned || false)}
                className="h-6 w-6 p-0"
              >
                <Pin className={`h-3 w-3 ${message.is_pinned ? "text-yellow-500" : "text-gray-400"}`} />
              </Button>
            )}
            {userType === "admin" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteMessage(message.id)}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="ml-6">
          {isLink ? (
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-4 w-4 text-blue-500" />
              <a
                href={message.message}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-all"
              >
                {message.message}
              </a>
            </div>
          ) : (
            <p className="text-gray-800 break-words">{message.message}</p>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <span className="text-lg font-semibold">{chatRoom?.course_title || "Chat Room"}</span>
            <Badge variant="outline" className="text-xs">
              Batch {chatRoom?.batch_number}
            </Badge>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>{chatRoom?.participant_count || 0}</span>
          </div>
        </CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className="p-0">
        {/* Messages Area */}
        <ScrollArea className="h-96 p-4">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map(renderMessage)
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <Separator />

        {/* Message Input */}
        <div className="p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isSending}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* User Type Indicator */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              {getUserIcon(userType)}
              <span>
                Chatting as {userName} ({userType})
              </span>
            </div>
            <span>Press Enter to send</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
