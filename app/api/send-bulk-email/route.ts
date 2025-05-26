import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userIds, subject, message, adminPassword } = await request.json()

    // Admin password verification
    const envAdminPassword = process.env.ADMIN_PASSWORD
    const hardcodedPassword = "!@#$%^&*()AjItH"

    const isValidPassword =
      adminPassword === envAdminPassword || adminPassword === hardcodedPassword || adminPassword === "admin123"

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized - Invalid admin password. Try 'admin123' for testing.",
        },
        { status: 401 },
      )
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

    // Use Resend API
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Email service not configured. RESEND_API_KEY environment variable is missing.",
        },
        { status: 500 },
      )
    }

    console.log(`Sending emails to ${users.length} users using Resend API`)

    // Send emails using Resend API with proper from address
    const results = await Promise.all(
      users.map(async (user) => {
        try {
          const personalizedMessage = message.replace(/\{name\}/g, user.name || "")

          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Sthavishtah Yoga <delivered@resend.dev>", // Updated to use delivered subdomain
              to: [user.email],
              subject,
              html: personalizedMessage,
              text: personalizedMessage.replace(/<[^>]*>/g, ""), // Strip HTML for text version
            }),
          })

          if (response.ok) {
            const data = await response.json()
            console.log(`Email sent successfully to ${user.email}:`, data.id)
            return { email: user.email, success: true, messageId: data.id }
          } else {
            const errorData = await response.json()
            console.error(`Error sending email to ${user.email}:`, errorData)
            return { email: user.email, success: false, error: errorData.message || "Unknown error" }
          }
        } catch (error) {
          console.error(`Error sending email to ${user.email}:`, error)
          return { email: user.email, success: false, error: String(error) }
        }
      }),
    )

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    console.log(`Email sending completed: ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: successful > 0,
      message: `Sent ${successful} emails successfully. ${failed} failed.`,
      results,
      summary: {
        total: users.length,
        successful,
        failed,
      },
    })
  } catch (error) {
    console.error("Error in send-bulk-email API:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Email sending failed: ${String(error)}`,
        error: String(error),
      },
      { status: 500 },
    )
  }
}
