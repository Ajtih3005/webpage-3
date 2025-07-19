"use client"

import { Button } from "@/components/ui/button"
import { logout, isUserLoggedIn, isAdminLoggedIn } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import { LogOut, User, Shield } from "lucide-react"

interface LoginButtonProps {
  className?: string
}

export function LoginButton({ className }: LoginButtonProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(isUserLoggedIn())
      setIsAdmin(isAdminLoggedIn())
    }

    checkAuth()

    // Check auth status periodically
    const interval = setInterval(checkAuth, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
      // Force redirect even if logout fails
      window.location.href = "/"
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    // Check if already logged in before redirecting
    if (isUserLoggedIn()) {
      window.location.href = "/user/dashboard"
    } else if (isAdminLoggedIn()) {
      window.location.href = "/admin/dashboard"
    } else {
      window.location.href = "/user/login"
    }
  }

  if (isLoggedIn || isAdmin) {
    return (
      <Button onClick={handleLogout} variant="outline" className={className} disabled={loading}>
        <LogOut className="mr-2 h-4 w-4" />
        {loading ? "Logging out..." : "Logout"}
        {isAdmin && <Shield className="ml-2 h-4 w-4" />}
      </Button>
    )
  }

  return (
    <Button onClick={handleLogin} className={className}>
      <User className="mr-2 h-4 w-4" />
      Login
    </Button>
  )
}
