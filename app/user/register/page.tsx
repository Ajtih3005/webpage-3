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
import { countries } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { X } from "lucide-react"

export default function UserRegister() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [country, setCountry] = useState("India")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(true)
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [preferredBatch, setPreferredBatch] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false)

  const validateForm = () => {
    if (!name.trim()) return "Name is required"

    if (!email.trim()) {
      return "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      return "Please enter a valid email address"
    }

    if (!phoneNumber.trim()) {
      return "Phone number is required"
    }

    if (!whatsappSameAsPhone && !whatsappNumber.trim()) {
      return "WhatsApp number is required if different from phone number"
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

  // Update the handleSubmit function to ensure it calls the auto-assign-free-subscription API
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
            whatsapp_number: whatsappSameAsPhone ? phoneNumber : whatsappNumber,
            preferred_batch: preferredBatch || null,
            password, // In a real app, you'd hash this
            country,
          },
        ])
        .select()

      if (error) throw error

      // Assign the free subscription to the new user
      try {
        const response = await fetch("/api/auto-assign-free-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        })

        if (!response.ok) {
          console.error("Failed to assign free subscription:", await response.text())
          // Continue with registration even if subscription assignment fails
        } else {
          console.log("Successfully assigned free 30-day subscription to new user")
        }
      } catch (subscriptionError) {
        console.error("Error assigning free subscription:", subscriptionError)
        // Continue with registration even if subscription assignment fails
      }

      // Show WhatsApp dialog instead of redirecting
      setShowWhatsAppDialog(true)
    } catch (error) {
      console.error("Registration error:", error)
      setError("An error occurred during registration. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppRedirect = () => {
    window.open("https://chat.whatsapp.com/H81SwZ9TxAPLqoU43yTYDW", "_blank")
    router.push("/user/login?registered=true")
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

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="whatsapp-same"
                      checked={whatsappSameAsPhone}
                      onChange={(e) => setWhatsappSameAsPhone(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="whatsapp-same">WhatsApp number is same as phone number</Label>
                  </div>

                  {!whatsappSameAsPhone && (
                    <div className="mt-2">
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="Enter your WhatsApp number"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                      />
                    </div>
                  )}
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
      {/* WhatsApp Group Dialog */}
      <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Registration Successful</DialogTitle>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => {
                  setShowWhatsAppDialog(false)
                  router.push("/user/login?registered=true")
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <DialogDescription>You have been successfully registered!</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>For updates on upcoming sessions and easier access to course materials, join our WhatsApp group.</p>
            <p className="font-medium">It is highly recommended to join the group for the best experience.</p>
          </div>
          <DialogFooter>
            <Button type="button" className="w-full" onClick={handleWhatsAppRedirect}>
              OK - Redirect to WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
