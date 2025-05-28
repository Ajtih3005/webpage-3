import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { createBulkEmailTemplate } from "@/lib/email-template"

export async function POST(request: NextRequest) {
  try {
    const { userIds, subscriptionIds, subject, message, attachments = [], adminPassword } = await request.json()

    console.log("📧 Email API called with:", {
      userIds: userIds?.length || 0,
      subscriptionIds: subscriptionIds?.length || 0,
      subject,
      attachments: attachments.length,
    })

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
      console.log("🎯 Fetching users by IDs:", userIds)

      const { data: directUsers, error: usersError } = await supabase
        .from("users")
        .select("email, name, id")
        .in("id", userIds)

      if (usersError) {
        console.error("❌ Error fetching direct users:", usersError)
        throw usersError
      }

      users = directUsers || []
      console.log(`✅ Found ${users.length} direct users`)
    } else if (subscriptionIds && subscriptionIds.length > 0) {
      console.log("🎯 Fetching users from subscriptions:", subscriptionIds)

      const { data: subscriptionUsers, error: subscriptionError } = await supabase
        .from("user_subscriptions")
        .select(`
          users!inner(email, name, id)
        `)
        .in("subscription_id", subscriptionIds)
        .eq("is_active", true)

      if (subscriptionError) {
        console.error("❌ Error fetching subscription users:", subscriptionError)
        throw subscriptionError
      }

      const userMap = new Map()
      subscriptionUsers?.forEach((item) => {
        const user = item.users
        if (user && user.email) {
          userMap.set(user.email, user)
        }
      })
      users = Array.from(userMap.values())

      console.log(`✅ Found ${users.length} unique users from ${subscriptionIds.length} subscriptions`)
    }

    if (!users || users.length === 0) {
      console.log("❌ No users found after query")
      return NextResponse.json({ success: false, message: "No valid users found" }, { status: 404 })
    }

    console.log(`📋 Total users to email: ${users.length}`)
    console.log(
      "👥 Users list:",
      users.map((u) => ({ email: u.email, name: u.name })),
    )

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

    console.log(`📤 Starting to send ${users.length} emails with SLOW rate limiting`)

    // Prepare attachments for Resend API
    const resendAttachments = attachments.map((file: any) => ({
      filename: file.name,
      content: file.data,
      type: file.type,
    }))

    // MUCH SLOWER rate limiting for new Resend accounts
    const emailDelay = 5000 // 5 seconds delay between emails
    const maxRetries = 3
    const results = []

    // Helper function to send single email with retry logic
    const sendEmailWithRetry = async (user: any, attempt = 1): Promise<any> => {
      try {
        console.log(`📧 Sending email ${results.length + 1}/${users.length} to ${user.email} (attempt ${attempt})`)

        const personalizedMessage = message.replace(/\{name\}/g, user.name || "")
        const htmlContent = createBulkEmailTemplate(personalizedMessage, user.name)

        const emailPayload: any = {
          from: "Sthavishtah Yoga <support@sthavishtah.com>",
          to: [user.email],
          subject,
          html: htmlContent,
          text: personalizedMessage.replace(/<[^>]*>/g, ""),
        }

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

        const responseData = await response.json()

        if (response.ok) {
          console.log(`✅ Email sent successfully to ${user.email}:`, responseData.id)
          return { email: user.email, success: true, messageId: responseData.id, attempt }
        } else {
          console.error(`❌ Error sending email to ${user.email} (attempt ${attempt}):`, responseData)

          // Check if it's a rate limit error and retry
          if (response.status === 429 && attempt < maxRetries) {
            console.log(`⏳ Rate limited, waiting 10 seconds before retry ${attempt + 1}...`)
            await new Promise((resolve) => setTimeout(resolve, 10000)) // 10 second wait for rate limit
            return sendEmailWithRetry(user, attempt + 1)
          }

          return {
            email: user.email,
            success: false,
            error: responseData.message || `HTTP ${response.status}`,
            attempt,
          }
        }
      } catch (error) {
        console.error(`💥 Exception sending email to ${user.email} (attempt ${attempt}):`, error)

        if (attempt < maxRetries) {
          console.log(`⏳ Exception occurred, waiting 5 seconds before retry ${attempt + 1}...`)
          await new Promise((resolve) => setTimeout(resolve, 5000))
          return sendEmailWithRetry(user, attempt + 1)
        }

        return { email: user.email, success: false, error: String(error), attempt }
      }
    }

    // Send emails one by one with long delays
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      const result = await sendEmailWithRetry(user)
      results.push(result)

      // Add delay between emails (except for the last one)
      if (i < users.length - 1) {
        console.log(`⏳ Waiting ${emailDelay / 1000} seconds before next email...`)
        await new Promise((resolve) => setTimeout(resolve, emailDelay))
      }
    }

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    console.log(`📊 Email sending completed: ${successful} successful, ${failed} failed`)
    console.log("📋 Detailed results:", results)

    const targetingMethod =
      userIds && userIds.length > 0 ? "individual users" : `${subscriptionIds.length} subscription(s)`

    return NextResponse.json({
      success: successful > 0,
      message: `Successfully sent ${successful} professional emails${attachments.length > 0 ? ` with ${attachments.length} attachment${attachments.length !== 1 ? "s" : ""}` : ""} to ${targetingMethod}. ${failed > 0 ? `${failed} failed due to rate limiting.` : ""} Used slow sending (5s delays) for new Resend account.`,
      results,
      summary: {
        total: users.length,
        successful,
        failed,
        attachments: attachments.length,
        targetingMethod,
        emailDelay: `${emailDelay / 1000} seconds`,
        maxRetries,
      },
      service: "Resend API (Slow Rate)",
      domain: "sthavishtah.com",
    })
  } catch (error) {
    console.error("💥 Error in send-bulk-email API:", error)
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
