/**
 * Nuclear logout - clears ALL browser storage
 */
export async function nuclearLogout() {
  try {
    console.log("🔥 NUCLEAR LOGOUT - Clearing ALL browser storage...")

    // 1. Call logout API
    const response = await fetch("/api/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: getCookie("userId") }),
    })

    // 2. Clear ALL cookies manually
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.trim().split("=")
      // Clear for current domain
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
      // Clear for all subdomains
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.sthavishtah.com;`
    })

    // 3. Clear localStorage
    localStorage.clear()

    // 4. Clear sessionStorage
    sessionStorage.clear()

    // 5. Clear IndexedDB (if any)
    if ("indexedDB" in window) {
      const databases = await indexedDB.databases()
      databases.forEach((db) => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name)
        }
      })
    }

    // 6. Clear cache storage
    if ("caches" in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((name) => caches.delete(name)))
    }

    console.log("✅ NUCLEAR LOGOUT COMPLETE - ALL storage cleared")

    // 7. Force page reload to ensure clean state
    window.location.href = "/"
  } catch (error) {
    console.error("❌ Nuclear logout error:", error)
    // Force reload anyway
    window.location.reload()
  }
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null
  return null
}
