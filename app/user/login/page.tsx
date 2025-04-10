"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function UserLogin() {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Check if already logged in
  useEffect(() => {
    const userId = localStorage.getItem("userId")
    if (userId) {
      console.log("User already logged in, redirecting to dashboard...")
      window.location.href = "/user/dashboard"
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phoneNumber.trim() || !password.trim()) {
      setError("Please enter both phone number and password.")
      return
    }

    try {
      setLoading(true)
      setError("")

      const supabase = getSupabaseBrowserClient()

      // Find user by phone number
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("phone_number", phoneNumber)
        .single()

      if (userError || !user) {
        setError("User not found. Please check your phone number.")
        setLoading(false)
        return
      }

      // Check password (in a real app, you'd use proper password hashing)
      if (user.password !== password) {
        setError("Invalid password. Please try again.")
        setLoading(false)
        return
      }

      console.log("User authenticated successfully:", user.id)

      // Store user info in localStorage instead of sessionStorage
      localStorage.setItem("userId", user.id.toString())
      localStorage.setItem("userName", user.name)
      localStorage.setItem("userEmail", user.email)
      localStorage.setItem("userPhone", user.phone_number)
      localStorage.setItem("userAuthenticated", "true")

      // Use direct navigation instead of Next.js router
      console.log("Redirecting to dashboard...")
      window.location.href = "/user/dashboard"
    } catch (error) {
      console.error("Login error:", error)
      setError("An error occurred during login. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">User Login</CardTitle>
            <CardDescription>Enter your phone number and password to access your account</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
              <div className="flex justify-between text-sm">
                <Link href="/user/register" className="text-primary hover:underline">
                  Don't have an account? Register
                </Link>
                <Link href="/" className="text-gray-500 hover:underline">
                  Back to Home
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
