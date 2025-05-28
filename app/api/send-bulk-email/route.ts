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

    // Batch processing to prevent timeouts
    const BATCH_SIZE = 10 // Process 10 emails at a time
    const EMAIL_DELAY = 3000 // 3 seconds between emails
    const BATCH_DELAY = 10000 // 10 seconds between batches
    const MAX_RETRIES = 3

    console.log(`📤 Starting batch email sending: ${users.length} users in batches of ${BATCH_SIZE}`)

    // Prepare attachments for Resend API
    const resendAttachments = attachments.map((file: any) => ({
      filename: file.name,
      content: file.data,
      type: file.type,
    }))

    const results = []
    let totalProcessed = 0

    // Helper function to send single email with retry logic
    const sendEmailWithRetry = async (user: any, attempt = 1): Promise<any> => {
      try {
        console.log(`📧 Sending email ${totalProcessed + 1}/${users.length} to ${user.email} (attempt ${attempt})`)

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
          if (response.status === 429 && attempt < MAX_RETRIES) {
            console.log(`⏳ Rate limited, waiting 15 seconds before retry ${attempt + 1}...`)
            await new Promise((resolve) => setTimeout(resolve, 15000)) // 15 second wait for rate limit
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

        if (attempt < MAX_RETRIES) {
          console.log(`⏳ Exception occurred, waiting 10 seconds before retry ${attempt + 1}...`)
          await new Promise((resolve) => setTimeout(resolve, 10000))
          return sendEmailWithRetry(user, attempt + 1)
        }

        return { email: user.email, success: false, error: String(error), attempt }
      }
    }

    // Process users in batches
    for (let batchIndex = 0; batchIndex < users.length; batchIndex += BATCH_SIZE) {
      const batch = users.slice(batchIndex, batchIndex + BATCH_SIZE)
      const batchNumber = Math.floor(batchIndex / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(users.length / BATCH_SIZE)

      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} users)`)

      try {
        // Process each email in the batch
        for (let i = 0; i < batch.length; i++) {
          const user = batch[i]

          try {
            const result = await sendEmailWithRetry(user)
            results.push(result)
            totalProcessed++

            // Add delay between emails within batch (except for the last one in batch)
            if (i < batch.length - 1) {
              console.log(`⏳ Waiting ${EMAIL_DELAY / 1000} seconds before next email...`)
              await new Promise((resolve) => setTimeout(resolve, EMAIL_DELAY))
            }
          } catch (emailError) {
            console.error(`💥 Failed to send email to ${user.email}:`, emailError)
            results.push({
              email: user.email,
              success: false,
              error: `Unexpected error: ${String(emailError)}`,
              attempt: 1,
            })
            totalProcessed++
          }
        }

        console.log(`✅ Batch ${batchNumber} completed. Processed: ${totalProcessed}/${users.length}`)

        // Add delay between batches (except for the last batch)
        if (batchIndex + BATCH_SIZE < users.length) {
          console.log(`⏳ Waiting ${BATCH_DELAY / 1000} seconds before next batch...`)
          await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY))
        }
      } catch (batchError) {
        console.error(`💥 Batch ${batchNumber} failed:`, batchError)

        // Mark remaining users in this batch as failed
        for (let i = results.length - totalProcessed; i < batch.length; i++) {
          results.push({
            email: batch[i].email,
            success: false,
            error: `Batch processing failed: ${String(batchError)}`,
            attempt: 1,
          })
          totalProcessed++
        }
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
      message: `Successfully sent ${successful}/${users.length} emails to ${targetingMethod}. ${failed > 0 ? `${failed} failed.` : ""} Used batch processing (${BATCH_SIZE} per batch) with ${EMAIL_DELAY / 1000}s delays.`,
      results,
      summary: {
        total: users.length,
        successful,
        failed,
        attachments: attachments.length,
        targetingMethod,
        batchSize: BATCH_SIZE,
        emailDelay: `${EMAIL_DELAY / 1000} seconds`,
        batchDelay: `${BATCH_DELAY / 1000} seconds`,
        maxRetries: MAX_RETRIES,
      },
      service: "Resend API (Batch Processing)",
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
