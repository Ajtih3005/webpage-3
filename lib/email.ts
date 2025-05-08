"use server"

import nodemailer from "nodemailer"
import { getSupabaseServerClient } from "@/lib/supabase"

// Function to get email configuration from database
export async function getEmailConfig() {
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase.from("email_config").select("*").limit(1).single()

    if (error) {
      console.error("Error fetching email config:", error)
      // Fall back to environment variables
      return {
        host: process.env.EMAIL_HOST || "",
        port: process.env.EMAIL_PORT || "",
        secure: process.env.EMAIL_SECURE === "true",
        email_user: process.env.EMAIL_USER || "", // Changed from user to email_user
        password: process.env.EMAIL_PASSWORD || "",
      }
    }

    return {
      host: data.host,
      port: data.port,
      secure: data.secure,
      email_user: data.email_user, // Changed from user to email_user
      password: data.password,
    }
  } catch (error) {
    console.error("Error in getEmailConfig:", error)
    // Fall back to environment variables
    return {
      host: process.env.EMAIL_HOST || "",
      port: process.env.EMAIL_PORT || "",
      secure: process.env.EMAIL_SECURE === "true",
      email_user: process.env.EMAIL_USER || "", // Changed from user to email_user
      password: process.env.EMAIL_PASSWORD || "",
    }
  }
}

// Function to create a nodemailer transporter
export async function createTransporter() {
  try {
    const config = await getEmailConfig()

    // Check if we have the required configuration
    if (!config.host || !config.port || !config.email_user || !config.password) {
      // Changed from user to email_user
      throw new Error("Missing email configuration")
    }

    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: Number.parseInt(config.port.toString()),
      secure: config.secure,
      auth: {
        user: config.email_user, // Changed from user to email_user
        pass: config.password,
      },
    })

    return transporter
  } catch (error) {
    console.error("Error creating email transporter:", error)
    throw error
  }
}

// Function to send an email
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: { to: string; subject: string; text: string; html?: string }) {
  try {
    const transporter = await createTransporter()
    const config = await getEmailConfig()

    const info = await transporter.sendMail({
      from: `"Yoga Platform" <${config.email_user}>`, // Changed from user to email_user
      to,
      subject,
      text,
      html: html || text,
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: error }
  }
}

export async function sendPasswordEmail(email: string, name: string, userId: string, password?: string) {
  try {
    const result = await sendEmail({
      to: email,
      subject: "Your Sthavishtah Yoga Account Password",
      text: `
        Hello ${name},

        Here are your login details for Sthavishtah Yoga:
        User ID: ${userId}
        Password: ${password || "Your password is stored securely. Please use the forgot password feature to reset it."}

        Please keep this information secure.

        Thank you,
        Sthavishtah Yoga Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a5568;">Hello ${name},</h2>
          <p>Here are your login details for Sthavishtah Yoga:</p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>User ID:</strong> ${userId}</li>
            <li><strong>Password:</strong> ${password || "Your password is stored securely. Please use the forgot password feature to reset it."}</li>
          </ul>
          <p>Please keep this information secure.</p>
          <p style="margin-top: 20px; font-size: 14px; color: #718096;">Thank you,<br>Sthavishtah Yoga Team</p>
        </div>
      `,
    })

    return result
  } catch (error) {
    console.error("Error sending password email:", error)
    return { success: false, error: error }
  }
}
