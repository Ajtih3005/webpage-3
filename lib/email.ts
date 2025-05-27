"use server"

import nodemailer from "nodemailer"
import { getSupabaseServerClient } from "@/lib/supabase"
import { createPasswordEmailTemplate } from "@/lib/email-template"

// Function to get email configuration from database
export async function getEmailConfig() {
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase.from("email_config").select("*").limit(1).single()

    if (error) {
      console.error("Error fetching email config:", error)
      // Fall back to environment variables
      return {
        host: process.env.EMAIL_HOST || "smtp.resend.com",
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
      host: process.env.EMAIL_HOST || "smtp.resend.com",
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
        "Missing email configuration. Please set EMAIL_HOST (smtp.resend.com), EMAIL_PORT (587), EMAIL_USER (resend), and EMAIL_PASSWORD (your-api-key) environment variables.",
      )
    }

    // Create a transporter with explicit configuration
    const transporter = nodemailer.createTransporter({
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
      from: `"Sthavishtah Yoga" <noreply@sthavishtah.com>`,
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
    // Use the professional letterhead template for password emails
    const htmlContent = createPasswordEmailTemplate(name, userId, password || "Please use forgot password feature")

    const result = await sendEmail({
      to: email,
      subject: "Welcome to Sthavishtah Yoga - Your Account Details",
      text: `
        Namaste ${name},

        Welcome to Sthavishtah Yoga! Your account has been created successfully.

        Your login details:
        User ID: ${userId}
        Password: ${password || "Please use the forgot password feature to reset it."}

        Please keep this information secure.

        With gratitude and light,
        The Sthavishtah Yoga Team
      `,
      html: htmlContent,
    })

    return result
  } catch (error) {
    console.error("Error sending password email:", error)
    return { success: false, error: String(error) }
  }
}
