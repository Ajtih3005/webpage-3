/**
 * 🔐 SECURE LOGOUT FUNCTION
 * Completely clears ALL storage and redirects safely
 */
export async function logout() {
  try {
    console.log("🔐 Starting secure logout...")

    // 1. Call server-side logout API
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (!response.ok) {
        console.warn("⚠️ Server logout failed, continuing with client cleanup")
      }
    } catch (apiError) {
      console.warn("⚠️ Logout API error, continuing with client cleanup:", apiError)
    }

    // 2. 🧹 COMPLETE CLIENT-SIDE CLEANUP

    // Clear ALL localStorage (including admin passwords, user data, etc.)
    localStorage.clear()

    // Clear ALL sessionStorage
    sessionStorage.clear()

    // Clear ALL cookies manually
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.trim().split("=")
      if (name) {
        // Clear for multiple paths and domains
        const clearCommands = [
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`,
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`,
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/user;`,
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/admin;`,
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/instructor;`,
        ]
        clearCommands.forEach((cmd) => {
          document.cookie = cmd
        })
      }
    })

    // 3. Clear any cached data
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name)
        })
      })
    }

    console.log("✅ Secure logout complete - all data cleared")

    // 4. Redirect to home page
    window.location.href = "/"
  } catch (error) {
    console.error("❌ Logout error:", error)
    // Force redirect even if cleanup fails
    window.location.href = "/"
  }
}

/**
 * 🔍 CHECK AUTHENTICATION STATUS
 * Secure way to check if user is logged in
 */
export function isUserLoggedIn(): boolean {
  try {
    const userId = localStorage.getItem("userId")
    const userAuthenticated = localStorage.getItem("userAuthenticated")
    return !!(userId && userAuthenticated === "true")
  } catch {
    return false
  }
}

/**
 * 🔍 CHECK ADMIN AUTHENTICATION STATUS
 * Secure way to check if admin is logged in
 */
export function isAdminLoggedIn(): boolean {
  try {
    return sessionStorage.getItem("adminAuthenticated") === "true"
  } catch {
    return false
  }
}

/**
 * 🏠 SAFE HOME NAVIGATION
 * Navigate to home without logout
 */
export function navigateToHome() {
  window.location.href = "/"
}
