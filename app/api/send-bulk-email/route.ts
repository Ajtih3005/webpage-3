import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { createTransporter, getEmailConfig } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { userIds, subject, message } = await request.json()

    // Get admin password from request headers or body
    const adminPassword = request.headers.get("x-admin-password") || ""

    // Verify admin password
    if (adminPassword !== process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD) {
      // Try to get email config from database as a fallback
      const supabase = getSupabaseServerClient()
      const { data: configData } = await supabase.from("email_config").select("admin_password").limit(1).single()

      if (!configData || adminPassword !== configData.admin_password) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
      }
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ success: false, message: "No users selected for email" }, { status: 400 })
    }

    if (!subject || !message) {
      return NextResponse.json({ success: false, message: "Subject and message are required" }, { status: 400 })
    }

    // Get users' email addresses
    const supabase = getSupabaseServerClient()
    const { data: users, error: usersError } = await supabase.from("users").select("email, name").in("id", userIds)

    if (usersError) {
      throw usersError
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ success: false, message: "No valid users found" }, { status: 404 })
    }

    // Create email transporter
    const transporter = await createTransporter()
    const config = await getEmailConfig()

    // Send emails to each user
    const results = await Promise.all(
      users.map(async (user) => {
        try {
          const personalizedMessage = message.replace(/\{name\}/g, user.name || "")

          const info = await transporter.sendMail({
            from: `"Yoga Platform" <${config.email_user}>`, // Changed from user to email_user
            to: user.email,
            subject,
            html: personalizedMessage,
          })

          return { email: user.email, success: true, messageId: info.messageId }
        } catch (error) {
          console.error(`Error sending email to ${user.email}:`, error)
          return { email: user.email, success: false, error: String(error) }
        }
      }),
    )

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Sent ${successful} emails successfully. ${failed} failed.`,
      results,
    })
  } catch (error) {
    console.error("Error in send-bulk-email API:", error)
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 })
  }
}
