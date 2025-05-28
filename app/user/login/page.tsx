"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Phone, Lock, Leaf } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect")

  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Show redirect info if coming from a link
  const isFromLink = redirectUrl?.startsWith("/l/")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Set localStorage values that the dashboard expects
        localStorage.setItem("userId", data.user.id.toString())
        localStorage.setItem("userAuthenticated", "true")
        localStorage.setItem("userName", data.user.name || "User")
        localStorage.setItem("userEmail", data.user.email || "")
        localStorage.setItem("userPhone", data.user.phone_number || "")

        // Also set user cookie for additional compatibility
        document.cookie = `userId=${data.user.id}; path=/; max-age=86400`

        console.log("Login successful, localStorage set:", {
          userId: localStorage.getItem("userId"),
          userAuthenticated: localStorage.getItem("userAuthenticated"),
          userName: localStorage.getItem("userName"),
        })

        // Small delay to ensure localStorage is set
        setTimeout(() => {
          if (redirectUrl) {
            router.push(redirectUrl)
          } else {
            router.push("/user/dashboard")
          }
        }, 100)
      } else {
        setError(data.error || "Login failed")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center p-4 forest-bg relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 leaf-pattern opacity-20"></div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10 opacity-30">
        <Leaf className="h-8 w-8 text-white animate-pulse" />
      </div>
      <div className="absolute top-20 right-20 opacity-20">
        <Leaf className="h-12 w-12 text-white animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
      <div className="absolute bottom-20 left-20 opacity-25">
        <Leaf className="h-6 w-6 text-white animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <div className="relative h-16 w-16">
                <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" priority />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">STHAVISHTAH</h1>
          <p className="text-white/80 text-sm tracking-widest">YOGA AND WELLNESS</p>
          <div className="w-24 h-1 bg-white/30 mx-auto mt-3 rounded-full"></div>
        </div>

        {/* Login Card */}
        <Card className="nature-card shadow-2xl border-0 animate-slide-up">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold forest-text-gradient">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600">
              {isFromLink
                ? "Please log in to access your requested content"
                : "Sign in to continue your wellness journey and find your inner peace"}
            </CardDescription>
          </CardHeader>

          {isFromLink && (
            <CardContent className="pb-4">
              <Alert className="border-green-200 bg-green-50">
                <Leaf className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  🔗 You'll be automatically redirected to your requested link after logging in.
                </AlertDescription>
              </Alert>
            </CardContent>
          )}

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="animate-fade-in">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="border-green-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-green-600" />
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-green-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <div className="flex w-full gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="flex-1 forest-outline-button"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                <Button type="submit" disabled={loading} className="flex-1 forest-button">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Leaf className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  New to our wellness community?{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-green-600 hover:text-green-700 font-medium"
                    onClick={() => router.push(`/user/register${redirectUrl ? `?redirect=${redirectUrl}` : ""}`)}
                  >
                    Join us today
                  </Button>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
