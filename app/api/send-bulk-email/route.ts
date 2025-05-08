import { type NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userIds, subject, message, adminPassword } = await request.json()

    // Verify admin password
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get user details from database
    const supabase = getSupabaseServerClient()
    const { data: users, error } = await supabase.from("users").select("*").in("id", userIds)

    if (error || !users || users.length === 0) {
      return NextResponse.json({ success: false, message: "No users found" }, { status: 404 })
    }

    // Send emails to all users
    const results = await Promise.all(
      users.map((user) =>
        sendEmail({
          to: user.email,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #4f46e5;">Sthavishtah Yoga</h1>
              </div>
              <p>Hello ${user.name},</p>
              ${message}
              <p>Thank you,<br>Sthavishtah Yoga Team</p>
            </div>
          `,
        }),
      ),
    )

    const failedEmails = results.filter((result) => !result.success).length

    if (failedEmails > 0) {
      return NextResponse.json(
        {
          success: true,
          message: `Sent ${results.length - failedEmails} emails, failed to send ${failedEmails} emails`,
        },
        { status: 207 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${results.length} emails`,
    })
  } catch (error) {
    console.error("Error in send-bulk-email API:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
