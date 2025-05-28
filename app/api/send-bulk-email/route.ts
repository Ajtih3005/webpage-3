import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { createBulkEmailTemplate } from "@/lib/email-template"

export async function POST(request: NextRequest) {
  try {
    const { userIds, subscriptionIds, subject, message, attachments = [], adminPassword } = await request.json()

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

    // Validate that we have either userIds or subscriptionIds
    if (
      (!userIds || !Array.isArray(userIds) || userIds.length === 0) &&
      (!subscriptionIds || !Array.isArray(subscriptionIds) || subscriptionIds.length === 0)
    ) {
      return NextResponse.json(
        { success: false, message: "No users or subscriptions selected for email" },
        { status: 400 },
      )
    }

    if (!subject || !message) {
      return NextResponse.json({ success: false, message: "Subject and message are required" }, { status: 400 })
    }

    // Validate attachments
    if (attachments && attachments.length > 0) {
      const maxAttachments = 10
      const maxSizePerFile = 10 * 1024 * 1024 // 10MB

      if (attachments.length > maxAttachments) {
        return NextResponse.json(
          { success: false, message: `Too many attachments. Maximum ${maxAttachments} files allowed.` },
          { status: 400 },
        )
      }

      for (const attachment of attachments) {
        if (!attachment.name || !attachment.data || !attachment.type) {
          return NextResponse.json({ success: false, message: "Invalid attachment format" }, { status: 400 })
        }

        // Estimate file size from base64 (base64 is ~33% larger than original)
        const estimatedSize = (attachment.data.length * 3) / 4
        if (estimatedSize > maxSizePerFile) {
          return NextResponse.json(
            { success: false, message: `Attachment ${attachment.name} is too large. Maximum 10MB per file.` },
            { status: 400 },
          )
        }
      }
    }

    const supabase = getSupabaseServerClient()
    let users = []

    // Get users based on targeting method
    if (userIds && userIds.length > 0) {
      // Direct user targeting
      const { data: directUsers, error: usersError } = await supabase
        .from("users")
        .select("email, name")
        .in("id", userIds)

      if (usersError) {
        throw usersError
      }
      users = directUsers || []
    } else if (subscriptionIds && subscriptionIds.length > 0) {
      // Subscription-based targeting
      console.log("Fetching users from subscriptions:", subscriptionIds)

      const { data: subscriptionUsers, error: subscriptionError } = await supabase
        .from("user_subscriptions")
        .select(`
          users!inner(email, name)
        `)
        .in("subscription_id", subscriptionIds)
        .eq("is_active", true) // Only send to users with active subscriptions

      if (subscriptionError) {
        console.error("Error fetching subscription users:", subscriptionError)
        throw subscriptionError
      }

      // Extract unique users (in case a user has multiple subscriptions)
      const userMap = new Map()
      subscriptionUsers?.forEach((item) => {
        const user = item.users
        if (user && user.email) {
          userMap.set(user.email, user)
        }
      })
      users = Array.from(userMap.values())

      console.log(`Found ${users.length} unique users from ${subscriptionIds.length} subscriptions`)
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ success: false, message: "No valid users found" }, { status: 404 })
    }

    // Use Resend API with your verified domain
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

    console.log(`Sending emails to ${users.length} users with ${attachments.length} attachments using Resend API`)

    // Prepare attachments for Resend API
    const resendAttachments = attachments.map((file: any) => ({
      filename: file.name,
      content: file.data, // base64 content
      type: file.type,
    }))

    // Send emails using Resend API with your verified domain
    const results = await Promise.all(
      users.map(async (user) => {
        try {
          // Create personalized message with Sthavishtah letterhead
          const personalizedMessage = message.replace(/\{name\}/g, user.name || "")
          const htmlContent = createBulkEmailTemplate(personalizedMessage, user.name)

          const emailPayload: any = {
            from: "Sthavishtah Yoga <noreply@sthavishtah.com>", // Your verified domain
            to: [user.email],
            subject,
            html: htmlContent,
            text: personalizedMessage.replace(/<[^>]*>/g, ""), // Strip HTML for text version
          }

          // Add attachments if any
          if (resendAttachments.length > 0) {
            emailPayload.attachments = resendAttachments
          }

          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailPayload),
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

    const targetingMethod =
      userIds && userIds.length > 0 ? "individual users" : `${subscriptionIds.length} subscription(s)`

    return NextResponse.json({
      success: successful > 0,
      message: `Successfully sent ${successful} professional emails${attachments.length > 0 ? ` with ${attachments.length} attachment${attachments.length !== 1 ? "s" : ""}` : ""} to ${targetingMethod} using Sthavishtah letterhead. ${failed} failed.`,
      results,
      summary: {
        total: users.length,
        successful,
        failed,
        attachments: attachments.length,
        targetingMethod,
      },
      service: "Resend API (Sthavishtah Letterhead)",
      domain: "sthavishtah.com",
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
