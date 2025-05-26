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
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: process.env.EMAIL_PORT || "587",
        secure: process.env.EMAIL_SECURE === "true" || false,
        email_user: process.env.EMAIL_USER || "",
        password: process.env.EMAIL_PASSWORD || "",
      }
    }

    return {
      host: data.host || "smtp.gmail.com",
      port: data.port || "587",
      secure: data.secure || false,
      email_user: data.email_user,
      password: data.password,
    }
  } catch (error) {
    console.error("Error in getEmailConfig:", error)
    // Fall back to environment variables with Gmail defaults
    return {
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || "587",
      secure: process.env.EMAIL_SECURE === "true" || false,
      email_user: process.env.EMAIL_USER || "",
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
      throw new Error(
        "Missing email configuration. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD environment variables.",
      )
    }

    // Create a transporter with explicit configuration
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: Number.parseInt(config.port.toString()),
      secure: config.secure, // true for 465, false for other ports
      auth: {
        user: config.email_user,
        pass: config.password,
      },
      // Add these options to avoid DNS issues
      tls: {
        rejectUnauthorized: false,
      },
      // Force IPv4 to avoid DNS lookup issues
      family: 4,
      // Add connection timeout
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    })

    // Verify the connection
    await transporter.verify()
    console.log("Email transporter verified successfully")

    return transporter
  } catch (error) {
    console.error("Error creating email transporter:", error)
    throw new Error(`Email configuration error: ${error}`)
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
      from: `"Sthavishtah Yoga" <${config.email_user}>`,
      to,
      subject,
      text,
      html: html || text,
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: String(error) }
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
    return { success: false, error: String(error) }
  }
}
