/**
 * 🔐 CLIENT-SIDE AUTHENTICATION UTILITIES
 * Secure authentication functions for both admin and user sessions
 */

/**
 * 🚪 SECURE LOGOUT FUNCTION
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
 * 🔍 CHECK USER AUTHENTICATION STATUS
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
    const sessionAuth = sessionStorage.getItem("adminAuthenticated") === "true"
    const localAuth = localStorage.getItem("adminAuthenticated") === "true"
    return sessionAuth || localAuth
  } catch {
    return false
  }
}

/**
 * 🔍 CHECK INSTRUCTOR AUTHENTICATION STATUS
 * Secure way to check if instructor is logged in
 */
export function isInstructorLoggedIn(): boolean {
  try {
    const instructorId = localStorage.getItem("instructorId")
    const instructorAuthenticated = localStorage.getItem("instructorAuthenticated")
    return !!(instructorId && instructorAuthenticated === "true")
  } catch {
    return false
  }
}

/**
 * 👤 GET CURRENT USER ID
 * Returns the current user's ID if logged in
 */
export function getCurrentUserId(): string | null {
  try {
    if (isUserLoggedIn()) {
      return localStorage.getItem("userId")
    }
    return null
  } catch {
    return null
  }
}

/**
 * 👨‍🏫 GET CURRENT INSTRUCTOR ID
 * Returns the current instructor's ID if logged in
 */
export function getCurrentInstructorId(): string | null {
  try {
    if (isInstructorLoggedIn()) {
      return localStorage.getItem("instructorId")
    }
    return null
  } catch {
    return null
  }
}

/**
 * 🔐 SET USER AUTHENTICATION
 * Securely store user authentication data
 */
export function setUserAuth(userId: string, userData?: any): void {
  try {
    localStorage.setItem("userId", userId)
    localStorage.setItem("userAuthenticated", "true")

    if (userData) {
      localStorage.setItem("userData", JSON.stringify(userData))
    }

    console.log("✅ User authentication set")
  } catch (error) {
    console.error("❌ Error setting user auth:", error)
  }
}

/**
 * 🔐 SET INSTRUCTOR AUTHENTICATION
 * Securely store instructor authentication data
 */
export function setInstructorAuth(instructorId: string, instructorData?: any): void {
  try {
    localStorage.setItem("instructorId", instructorId)
    localStorage.setItem("instructorAuthenticated", "true")

    if (instructorData) {
      localStorage.setItem("instructorData", JSON.stringify(instructorData))
    }

    console.log("✅ Instructor authentication set")
  } catch (error) {
    console.error("❌ Error setting instructor auth:", error)
  }
}

/**
 * 🔐 SET ADMIN AUTHENTICATION
 * Securely store admin authentication data
 */
export function setAdminAuth(): void {
  try {
    // Use sessionStorage for admin (more secure, doesn't persist)
    sessionStorage.setItem("adminAuthenticated", "true")
    console.log("✅ Admin authentication set")
  } catch (error) {
    console.error("❌ Error setting admin auth:", error)
  }
}

/**
 * 🧹 CLEAR USER AUTHENTICATION
 * Clear only user-related authentication data
 */
export function clearUserAuth(): void {
  try {
    localStorage.removeItem("userId")
    localStorage.removeItem("userAuthenticated")
    localStorage.removeItem("userData")
    console.log("✅ User authentication cleared")
  } catch (error) {
    console.error("❌ Error clearing user auth:", error)
  }
}

/**
 * 🧹 CLEAR INSTRUCTOR AUTHENTICATION
 * Clear only instructor-related authentication data
 */
export function clearInstructorAuth(): void {
  try {
    localStorage.removeItem("instructorId")
    localStorage.removeItem("instructorAuthenticated")
    localStorage.removeItem("instructorData")
    console.log("✅ Instructor authentication cleared")
  } catch (error) {
    console.error("❌ Error clearing instructor auth:", error)
  }
}

/**
 * 🧹 CLEAR ADMIN AUTHENTICATION
 * Clear only admin-related authentication data
 */
export function clearAdminAuth(): void {
  try {
    sessionStorage.removeItem("adminAuthenticated")
    localStorage.removeItem("adminAuthenticated") // Clear old localStorage too
    console.log("✅ Admin authentication cleared")
  } catch (error) {
    console.error("❌ Error clearing admin auth:", error)
  }
}

/**
 * 🏠 SAFE HOME NAVIGATION
 * Navigate to home without logout
 */
export function navigateToHome(): void {
  window.location.href = "/"
}

/**
 * 🔄 REDIRECT TO LOGIN
 * Redirect to appropriate login page with return URL
 */
export function redirectToLogin(returnUrl?: string, userType: "user" | "admin" | "instructor" = "user"): void {
  const loginPaths = {
    user: "/user/login",
    admin: "/admin/login",
    instructor: "/instructor/login",
  }

  const loginPath = loginPaths[userType]
  const redirectUrl = returnUrl ? `${loginPath}?redirect=${encodeURIComponent(returnUrl)}` : loginPath

  window.location.href = redirectUrl
}

/**
 * 🔍 GET USER DATA
 * Get stored user data if available
 */
export function getUserData(): any | null {
  try {
    const userData = localStorage.getItem("userData")
    return userData ? JSON.parse(userData) : null
  } catch {
    return null
  }
}

/**
 * 🔍 GET INSTRUCTOR DATA
 * Get stored instructor data if available
 */
export function getInstructorData(): any | null {
  try {
    const instructorData = localStorage.getItem("instructorData")
    return instructorData ? JSON.parse(instructorData) : null
  } catch {
    return null
  }
}

/**
 * 🔒 CHECK IF ANY USER IS LOGGED IN
 * Check if any type of user (user, admin, instructor) is logged in
 */
export function isAnyUserLoggedIn(): boolean {
  return isUserLoggedIn() || isAdminLoggedIn() || isInstructorLoggedIn()
}

/**
 * 🎯 GET CURRENT USER TYPE
 * Returns the type of currently logged in user
 */
export function getCurrentUserType(): "user" | "admin" | "instructor" | null {
  if (isAdminLoggedIn()) return "admin"
  if (isInstructorLoggedIn()) return "instructor"
  if (isUserLoggedIn()) return "user"
  return null
}

/**
 * 🔄 AUTO-REDIRECT BASED ON AUTH
 * Automatically redirect based on current authentication status
 */
export function autoRedirectBasedOnAuth(currentPath: string): void {
  const userType = getCurrentUserType()

  if (!userType) {
    // Not logged in, redirect to appropriate login
    if (currentPath.startsWith("/admin")) {
      redirectToLogin(currentPath, "admin")
    } else if (currentPath.startsWith("/instructor")) {
      redirectToLogin(currentPath, "instructor")
    } else if (currentPath.startsWith("/user")) {
      redirectToLogin(currentPath, "user")
    }
    return
  }

  // Logged in, check if accessing correct area
  if (userType === "admin" && !currentPath.startsWith("/admin")) {
    window.location.href = "/admin/dashboard"
  } else if (userType === "instructor" && !currentPath.startsWith("/instructor")) {
    window.location.href = "/instructor/dashboard"
  } else if (userType === "user" && currentPath.startsWith("/admin")) {
    window.location.href = "/user/dashboard"
  }
}
