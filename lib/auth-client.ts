/**
 * Enhanced logout function that specifically targets userId cookie
 */
export async function logout() {
  try {
    console.log("🔐 Logging out...")

    // 1. Call the clear-user-id-cookie API
    await fetch("/api/clear-user-id-cookie")

    // 2. Call regular logout API
    await fetch("/api/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })

    // 3. Clear userId cookie manually with multiple approaches
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;"
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/user;"
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/admin;"
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/api;"
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/l;"
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=sthavishtah.com; path=/;"

    // 4. Clear localStorage and sessionStorage
    localStorage.removeItem("userId")
    sessionStorage.removeItem("userId")

    console.log("✅ Logout complete - userId cookie cleared")

    // 5. Redirect to home page
    window.location.href = "/"
  } catch (error) {
    console.error("❌ Logout error:", error)
    // Force redirect even if error
    window.location.href = "/"
  }
}
