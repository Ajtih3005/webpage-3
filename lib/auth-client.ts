/**
 * Client-side authentication utilities
 */

/**
 * Logs the user out by clearing ALL browser storage
 */
export async function logout() {
  try {
    console.log("🔐 Logging out and clearing ALL storage...")

    // Get token from cookie or localStorage if available
    const token =
      getCookie("userToken") ||
      getCookie("authToken") ||
      getCookie("userId") ||
      localStorage.getItem("userToken") ||
      localStorage.getItem("userId")

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

    // Clear ALL cookies (not just auth cookies)
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.trim().split("=")
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
    })

    // Clear localStorage
    localStorage.clear()

    // Clear sessionStorage
    sessionStorage.clear()

    console.log("✅ Logout complete - ALL browser storage cleared")

    // Redirect to home page
    window.location.href = "/"
  } catch (error) {
    console.error("❌ Logout error:", error)
    // Force redirect even if error
    window.location.href = "/"
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
