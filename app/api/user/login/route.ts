import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json()
    console.log("Login attempt for phone:", phone)

    if (!phone || !password) {
      return NextResponse.json({ error: "Phone and password are required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Clean phone number - remove spaces, dashes, etc.
    const cleanPhone = phone.replace(/\s+|-|$$|$$|\+|\./g, "")

    // Try different phone formats based on your schema
    const phoneVariants = [
      phone, // Original input
      cleanPhone, // Cleaned version
      `+91${cleanPhone}`, // With +91 prefix
      `91${cleanPhone}`, // With 91 prefix
      cleanPhone.startsWith("91") ? cleanPhone.substring(2) : cleanPhone, // Remove 91 if present
    ]

    console.log("Trying phone variants:", phoneVariants)

    // Query users table with multiple phone column options
    let user = null

    for (const phoneVariant of phoneVariants) {
      // Try phone_number column first (most likely based on schema)
      const { data: userData, error } = await supabase
        .from("users")
        .select("id, user_id, name, email, phone_number, phone, whatsapp_number, password")
        .or(`phone_number.eq.${phoneVariant},phone.eq.${phoneVariant},whatsapp_number.eq.${phoneVariant}`)
        .limit(1)

      if (userData && userData.length > 0) {
        user = userData[0]
        console.log("User found with phone variant:", phoneVariant)
        break
      }
    }

    if (!user) {
      console.log("No user found with provided phone number")
      return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 })
    }

    console.log("User found:", {
      id: user.id,
      name: user.name,
      phone_number: user.phone_number,
      phone: user.phone,
      whatsapp_number: user.whatsapp_number,
    })

    // Verify password using the 'password' column
    let isValidPassword = false

    if (user.password) {
      try {
        // Try bcrypt first (for hashed passwords)
        if (user.password.startsWith("$2")) {
          isValidPassword = await bcrypt.compare(password, user.password)
          console.log("Bcrypt comparison result:", isValidPassword)
        } else {
          // Plain text comparison (for legacy passwords)
          isValidPassword = password === user.password
          console.log("Plain text comparison result:", isValidPassword)
        }
      } catch (passwordError) {
        console.error("Password comparison error:", passwordError)
        // Fallback to plain text
        isValidPassword = password === user.password
        console.log("Fallback comparison result:", isValidPassword)
      }
    }

    if (!isValidPassword) {
      console.log("Password validation failed")
      return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 })
    }

    // Log successful login
    try {
      const { error: logError } = await supabase.from("auth_logs").insert({
        event_type: "user_login_success",
        user_id: user.id,
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
        success: true,
      })

      if (logError) {
        console.warn("Could not log authentication:", logError)
      }
    } catch (logErr) {
      console.warn("Auth logging error:", logErr)
    }

    console.log("Login successful for user:", user.id)

    // Return user data (excluding password)
    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number || user.phone || user.whatsapp_number,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "An error occurred while logging in" }, { status: 500 })
  }
}
