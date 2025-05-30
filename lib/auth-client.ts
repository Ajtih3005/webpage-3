export async function logout() {
  try {
    console.log("🔐 Logging out...")

    // Call logout API
    const response = await fetch("/api/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      console.error("❌ Logout API error:", response.status)
    }

    // Clear userId cookie manually
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;"
    document.cookie = "pvisitor=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;"

    // Clear any localStorage/sessionStorage
    localStorage.clear()
    sessionStorage.clear()

    console.log("✅ Logout complete")

    // Redirect to home
    window.location.href = "/"
  } catch (error) {
    console.error("❌ Logout error:", error)
    window.location.href = "/"
  }
}
