import nodemailer from "nodemailer"

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number.parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// General email sending function
export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  from?: string
  attachments?: any[]
}) {
  try {
    const { to, subject, html, from, attachments } = options

    const mailOptions = {
      from: from || `"Sthavishtah Yoga" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error }
  }
}

// Specific function for password emails
export async function sendPasswordEmail(to: string, name: string, userId: string, password: string) {
  return sendEmail({
    to,
    subject: "Your Sthavishtah Yoga Account Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4f46e5;">Sthavishtah Yoga</h1>
        </div>
        <p>Hello ${name},</p>
        <p>Your account has been created successfully. Here are your login credentials:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        <p>Please keep this information secure and do not share it with anyone.</p>
        <p>You can log in at: <a href="${process.env.NEXT_PUBLIC_APP_URL}/user/login">${process.env.NEXT_PUBLIC_APP_URL}/user/login</a></p>
        <p>If you have any questions, please contact us.</p>
        <p>Thank you,<br>Sthavishtah Yoga Team</p>
      </div>
    `,
  })
}
