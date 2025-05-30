/**
 * Client-side authentication utilities
 */

/**
 * Logs the user out by clearing cookies and invalidating the token
 */
export async function logout() {
  try {
    console.log("🔐 Logging out...")

    // Get token from cookie if available
    const token = getCookie("userToken") || getCookie("authToken") || getCookie("sessionId")

    // Call logout API
    const response = await fetch("/api/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      console.error("❌ Logout API error:", response.status)
    }

    // Clear cookies manually as backup
    const cookiesToClear = [
      "userId",
      "user_id",
      "userToken",
      "user_token",
      "authToken",
      "auth_token",
      "sessionId",
      "session_id",
      "loginToken",
      "login_token",
    ]

    for (const cookieName of cookiesToClear) {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
    }

    console.log("✅ Logout complete - cookies cleared")

    // Redirect to home page
    window.location.href = "/"
  } catch (error) {
    console.error("❌ Logout error:", error)
  }
}

/**
 * Helper to get a cookie value
 */
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null
  return null
}
