import { getSupabaseBrowserClient } from "./supabase"

// Session duration in seconds (30 days)
const SESSION_DURATION = 30 * 24 * 60 * 60

export async function loginUser(email: string, password: string) {
  try {
    const supabase = getSupabaseBrowserClient()

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        // Set a long session duration
        expiresIn: SESSION_DURATION,
      },
    })

    if (error) {
      console.error("Login error:", error)
      return { success: false, error: error.message }
    }

    if (!data.user || !data.session) {
      return { success: false, error: "No user data returned" }
    }

    // Store user ID in localStorage for persistence
    localStorage.setItem("userId", data.user.id)
    localStorage.setItem("userEmail", data.user.email || "")

    // Set a session cookie with a long expiration
    document.cookie = `session_active=true; path=/; max-age=${SESSION_DURATION}; SameSite=Lax`

    return { success: true, user: data.user }
  } catch (error: any) {
    console.error("Unexpected login error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function logoutUser() {
  try {
    const supabase = getSupabaseBrowserClient()

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Logout error:", error)
      return { success: false, error: error.message }
    }

    // Clear localStorage
    localStorage.removeItem("userId")
    localStorage.removeItem("userEmail")

    // Clear session cookie
    document.cookie = "session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected logout error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function checkUserSession() {
  try {
    const supabase = getSupabaseBrowserClient()

    // Check if we have a session
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Session check error:", error)
      return { loggedIn: false }
    }

    // If we have a valid session
    if (data.session) {
      // Make sure localStorage is in sync
      if (!localStorage.getItem("userId")) {
        localStorage.setItem("userId", data.session.user.id)
      }
      if (!localStorage.getItem("userEmail") && data.session.user.email) {
        localStorage.setItem("userEmail", data.session.user.email)
      }

      return {
        loggedIn: true,
        user: data.session.user,
      }
    }

    return { loggedIn: false }
  } catch (error) {
    console.error("Unexpected session check error:", error)
    return { loggedIn: false }
  }
}

export function getUserFromLocalStorage() {
  const userId = localStorage.getItem("userId")
  const userEmail = localStorage.getItem("userEmail")

  if (userId) {
    return {
      id: userId,
      email: userEmail || undefined,
    }
  }

  return null
}
