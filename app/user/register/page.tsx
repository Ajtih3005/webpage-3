"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { generateUserId } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function UserRegister() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [preferredBatch, setPreferredBatch] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateForm = () => {
    if (!name.trim()) return "Name is required"

    if (!email.trim()) {
      return "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      return "Please enter a valid email address"
    }

    if (!phoneNumber.trim()) {
      return "Phone number is required"
    } else if (!/^\d{10}$/.test(phoneNumber.replace(/\D/g, ""))) {
      return "Please enter a valid 10-digit phone number"
    }

    if (whatsappNumber && !/^\d{10}$/.test(whatsappNumber.replace(/\D/g, ""))) {
      return "Please enter a valid 10-digit WhatsApp number"
    }

    if (!password) {
      return "Password is required"
    } else if (password.length < 6) {
      return "Password must be at least 6 characters long"
    }

    if (password !== confirmPassword) {
      return "Passwords do not match"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setLoading(true)
      setError("")

      const supabase = getSupabaseBrowserClient()

      // Check if phone number already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("phone_number", phoneNumber)
        .single()

      if (!checkError && existingUser) {
        setError("This phone number is already registered. Please login or use a different number.")
        return
      }

      // Generate a unique user ID
      const userId = generateUserId()

      // Insert the new user
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            user_id: userId,
            name,
            email,
            phone_number: phoneNumber,
            whatsapp_number: whatsappNumber || null,
            preferred_batch: preferredBatch || null,
            password, // In a real app, you'd hash this
          },
        ])
        .select()

      if (error) throw error

      // Redirect to login page
      router.push("/user/login?registered=true")
    } catch (error) {
      console.error("Registration error:", error)
      setError("An error occurred during registration. Please try again.")
    } finally {
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
            <CardTitle className="text-2xl">User Registration</CardTitle>
            <CardDescription>Create a new account to access yoga and wellness courses</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number (Optional)</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="Enter your WhatsApp number if different"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                  />
                </div>

                {/* Preferred Batch */}
                <div className="space-y-2">
                  <Label htmlFor="batch">Preferred Batch (Optional)</Label>
                  <Select value={preferredBatch} onValueChange={setPreferredBatch}>
                    <SelectTrigger id="batch">
                      <SelectValue placeholder="Select preferred batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No preference</SelectItem>
                      <SelectItem value="1">Morning Batch 1 (5:30 to 6:30)</SelectItem>
                      <SelectItem value="2">Morning Batch 2 (6:40 to 7:40)</SelectItem>
                      <SelectItem value="3">Morning Batch 3 (7:50 to 8:50)</SelectItem>
                      <SelectItem value="4">Evening Batch 4 (5:30 to 6:30)</SelectItem>
                      <SelectItem value="5">Evening Batch 5 (6:40 to 7:40)</SelectItem>
                      <SelectItem value="6">Evening Batch 6 (7:50 to 8:50)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
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

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
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
                {loading ? "Registering..." : "Register"}
              </Button>
              <div className="flex justify-between text-sm">
                <Link href="/user/login" className="text-primary hover:underline">
                  Already have an account? Login
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
