"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Logo } from "@/components/logo"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function AdminLogin() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const redirect = searchParams.get("redirect") || "/admin/dashboard"

  useEffect(() => {
    const checkExistingAuth = () => {
      try {
        // Check if already authenticated
        const adminAuthLocal = localStorage.getItem("adminAuthenticated")
        const adminAuthSession = sessionStorage.getItem("adminAuthenticated")

        if (adminAuthLocal === "true" || adminAuthSession === "true") {
          // Already logged in, redirect to dashboard or specified redirect
          router.push(redirect)
          return
        }
      } catch (error) {
        console.error("Auth check error:", error)
      }

      setCheckingAuth(false)
    }

    checkExistingAuth()
  }, [router, redirect])

  const handleLogoClick = () => {
    router.push("/")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Validate password
      if (!password) {
        setError("Please enter the admin password")
        setLoading(false)
        return
      }

      // Check against environment variable
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

      if (password === adminPassword) {
        // Store authentication status (NOT the password)
        sessionStorage.setItem("adminAuthenticated", "true")

        // Clear password input for security
        setPassword("")

        // Redirect to dashboard or specified redirect
        router.push(redirect)
      } else {
        setError("Invalid admin password")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <button onClick={handleLogoClick} className="hover:opacity-80 transition-opacity">
              <Logo />
            </button>
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">Admin Login</CardTitle>
          <CardDescription>Enter your admin password to access the admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="pr-10"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button variant="link" onClick={handleLogoClick} className="text-sm text-gray-600 hover:text-gray-900">
              ← Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
