import { createClient } from "@/lib/supabase"

export interface ChatMessage {
  id: string
  course_id: number
  user_id: string
  user_name: string
  user_type: "student" | "instructor" | "admin"
  message: string
  message_type: "text" | "link" | "announcement"
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface ChatRoom {
  course_id: number
  course_title: string
  batch_number: number
  subscription_name: string
  active_users: number
}

// Get chat room ID from course ID
export function getChatRoomId(courseId: number): string {
  return `chat_${courseId}`
}

// Get chat messages for a specific course
export async function getChatMessages(courseId: number): Promise<ChatMessage[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true })
    .limit(100)

  if (error) {
    console.error("Error fetching chat messages:", error)
    return []
  }

  return data || []
}

// Send a new chat message
export async function sendChatMessage(
  courseId: number,
  userId: string,
  userName: string,
  userType: "student" | "instructor" | "admin",
  message: string,
  messageType: "text" | "link" | "announcement" = "text",
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("chat_messages").insert({
    course_id: courseId,
    user_id: userId,
    user_name: userName,
    user_type: userType,
    message: message.trim(),
    message_type: messageType,
    is_pinned: false,
  })

  if (error) {
    console.error("Error sending chat message:", error)
    return false
  }

  return true
}

// Pin/Unpin a message (admin/instructor only)
export async function togglePinMessage(messageId: string, isPinned: boolean): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("chat_messages").update({ is_pinned: isPinned }).eq("id", messageId)

  if (error) {
    console.error("Error toggling pin message:", error)
    return false
  }

  return true
}

// Delete a message (admin/instructor only)
export async function deleteChatMessage(messageId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("chat_messages").delete().eq("id", messageId)

  if (error) {
    console.error("Error deleting chat message:", error)
    return false
  }

  return true
}

// Get course info for chat room header
export async function getCourseInfo(courseId: number): Promise<ChatRoom | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      batch_number,
      subscriptions (name)
    `)
    .eq("id", courseId)
    .single()

  if (error) {
    console.error("Error fetching course info:", error)
    return null
  }

  return {
    course_id: data.id,
    course_title: data.title,
    batch_number: data.batch_number,
    subscription_name: data.subscriptions?.name || "Unknown",
    active_users: 0, // Will be updated with real-time data
  }
}

// Subscribe to real-time chat updates
export function subscribeToChatRoom(courseId: number, onMessage: (message: ChatMessage) => void) {
  const supabase = createClient()

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
