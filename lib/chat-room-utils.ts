import { getSupabaseBrowserClient } from "./supabase"

export interface ChatMessage {
  id: string
  course_id: number
  user_id: string
  user_name: string
  user_type: "student" | "instructor" | "admin"
  message: string
  message_type: "text" | "link" | "announcement"
  created_at: string
  is_pinned?: boolean
}

export interface ChatRoom {
  id: string
  course_id: number
  course_title: string
  batch_number: number
  is_active: boolean
  participant_count: number
}

// Generate chat room ID from course ID
export function getChatRoomId(courseId: number): string {
  return `chat_${courseId}`
}

// Get chat room info
export async function getChatRoomInfo(courseId: number): Promise<ChatRoom | null> {
  const supabase = getSupabaseBrowserClient()

  try {
    // Get course details
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, batch_number")
      .eq("id", courseId)
      .single()

    if (courseError || !course) {
      console.error("Error fetching course:", courseError)
      return null
    }

    // Get participant count (users currently in this course)
    const { count: participantCount } = await supabase
      .from("user_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("course_id", courseId)
      .eq("status", "active")

    return {
      id: getChatRoomId(courseId),
      course_id: courseId,
      course_title: course.title,
      batch_number: course.batch_number,
      is_active: true,
      participant_count: participantCount || 0,
    }
  } catch (error) {
    console.error("Error getting chat room info:", error)
    return null
  }
}

// Send message to chat room
export async function sendChatMessage(
  courseId: number,
  userId: string,
  userName: string,
  userType: "student" | "instructor" | "admin",
  message: string,
  messageType: "text" | "link" | "announcement" = "text",
): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()

  try {
    const { error } = await supabase.from("chat_messages").insert({
      course_id: courseId,
      user_id: userId,
      user_name: userName,
      user_type: userType,
      message: message.trim(),
      message_type: messageType,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error sending message:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error sending chat message:", error)
    return false
  }
}

// Get chat messages for a course
export async function getChatMessages(courseId: number, limit = 50): Promise<ChatMessage[]> {
  const supabase = getSupabaseBrowserClient()

  try {
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching messages:", error)
      return []
    }

    // Return in chronological order (oldest first)
    return (messages || []).reverse()
  } catch (error) {
    console.error("Error getting chat messages:", error)
    return []
  }
}

// Subscribe to real-time chat updates
export function subscribeToChatRoom(courseId: number, onMessage: (message: ChatMessage) => void) {
  const supabase = getSupabaseBrowserClient()

  const subscription = supabase
    .channel(`chat_${courseId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `course_id=eq.${courseId}`,
      },
      (payload) => {
        onMessage(payload.new as ChatMessage)
      },
    )
    .subscribe()

  return subscription
}

// Pin/unpin message (admin/instructor only)
export async function toggleMessagePin(
  messageId: string,
  isPinned: boolean,
  userType: "student" | "instructor" | "admin",
): Promise<boolean> {
  if (userType === "student") {
    console.error("Students cannot pin messages")
    return false
  }

  const supabase = getSupabaseBrowserClient()

  try {
    const { error } = await supabase.from("chat_messages").update({ is_pinned: isPinned }).eq("id", messageId)

    if (error) {
      console.error("Error toggling message pin:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error toggling message pin:", error)
    return false
  }
}

// Delete message (admin only)
export async function deleteChatMessage(
  messageId: string,
  userType: "student" | "instructor" | "admin",
): Promise<boolean> {
  if (userType !== "admin") {
    console.error("Only admins can delete messages")
    return false
  }

  const supabase = getSupabaseBrowserClient()

  try {
    const { error } = await supabase.from("chat_messages").delete().eq("id", messageId)

    if (error) {
      console.error("Error deleting message:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting message:", error)
    return false
  }
}
