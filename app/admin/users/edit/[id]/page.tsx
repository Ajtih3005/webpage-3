"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, AlertCircle, CheckCircle } from "lucide-react"
import { countries } from "@/lib/utils"

interface User {
  id: number
  user_id: string
  name: string
  email: string
  phone_number: string
  whatsapp_number: string | null
  preferred_batch: string | null
  created_at: string
  country: string | null
}

export default function EditUser({ params }: { params: { id: string } }) {
  const router = useRouter()
  const userId = Number.parseInt(params.id)

  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [preferredBatch, setPreferredBatch] = useState("")
  const [country, setCountry] = useState("India") // Default to India if not set
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    fetchUser()
  }, [userId])

  async function fetchUser() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching user:", error)
        setSaveStatus({
          type: "error",
          message: `Failed to fetch user: ${error.message}`,
        })
        return
      }

      if (data) {
        setUser(data)
        setName(data.name || "")
        setEmail(data.email || "")
        setPhoneNumber(data.phone_number || "")
        setWhatsappNumber(data.whatsapp_number || "")
        setPreferredBatch(data.preferred_batch || "")
        setCountry(data.country || "India") // Default to India if not set
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      setSaveStatus({
        type: "error",
        message: "An unexpected error occurred while fetching user data",
      })
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = "Name is required"
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveStatus(null)

    if (!validateForm()) return

    try {
      setSaving(true)
      const supabase = getSupabaseBrowserClient()

      // Check if phone number is already in use by another user
      if (phoneNumber !== user?.phone_number) {
        const { data: existingUser, error: checkError } = await supabase
          .from("users")
          .select("id")
          .eq("phone_number", phoneNumber)
          .neq("id", userId)
          .single()

        if (!checkError && existingUser) {
          setErrors({
            ...errors,
            phoneNumber: "This phone number is already in use by another user",
          })
          setSaving(false)
          return
        }
      }

      // Check if email is already in use by another user
      if (email !== user?.email) {
        const { data: existingEmailUser, error: emailCheckError } = await supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .neq("id", userId)
          .single()

        if (!emailCheckError && existingEmailUser) {
          setErrors({
            ...errors,
            email: "This email is already in use by another user",
          })
          setSaving(false)
          return
        }
      }

      const { error } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          email: email.trim(),
          phone_number: phoneNumber.trim(),
          whatsapp_number: whatsappNumber.trim() || null,
          preferred_batch: preferredBatch || null,
          country: country || "India",
        })
        .eq("id", userId)

      if (error) {
        console.error("Error updating user:", error)
        setSaveStatus({
          type: "error",
          message: `Failed to update user: ${error.message}`,
        })
        return
      }

      setSaveStatus({
        type: "success",
        message: "User updated successfully!",
      })

      // Refresh user data
      await fetchUser()

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/admin/users")
      }, 2000)
    } catch (error) {
      console.error("Error updating user:", error)
      setSaveStatus({
        type: "error",
        message: "An unexpected error occurred while updating the user",
      })
    } finally {
      setSaving(false)
    }
  }

  const sendPasswordEmail = async () => {
    if (!user) return

    try {
      setSendingEmail(true)
      setEmailStatus(null)

      // Get admin password from environment or localStorage
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || localStorage.getItem("adminPassword") || ""

      const response = await fetch("/api/send-password-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          adminPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setEmailStatus({
          type: "success",
          message: "Password email sent successfully!",
        })
      } else {
        setEmailStatus({
          type: "error",
          message: data.message || "Failed to send password email",
        })
      }
    } catch (error) {
      console.error("Error sending password email:", error)
      setEmailStatus({
        type: "error",
        message: "An unexpected error occurred while sending email",
      })
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading user data...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h2>
            <p className="text-gray-600 mb-4">The user you're looking for doesn't exist or has been deleted.</p>
            <Button onClick={() => router.push("/admin/users")} variant="outline">
              Back to Users
            </Button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
          <Button variant="outline" onClick={() => router.push("/admin/users")}>
            Back to Users
          </Button>
        </div>

        {saveStatus && (
          <Alert variant={saveStatus.type === "success" ? "default" : "destructive"}>
            {saveStatus.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{saveStatus.message}</AlertDescription>
          </Alert>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
              <CardDescription>Update user information for {user.user_id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User ID (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="user-id">User ID</Label>
                <Input id="user-id" value={user.user_id} disabled readOnly className="bg-gray-50" />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) {
                      setErrors({ ...errors, name: "" })
                    }
                  }}
                  placeholder="Enter user's name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) {
                      setErrors({ ...errors, email: "" })
                    }
                  }}
                  placeholder="Enter user's email"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value)
                    if (errors.phoneNumber) {
                      setErrors({ ...errors, phoneNumber: "" })
                    }
                  }}
                  placeholder="Enter user's phone number"
                  className={errors.phoneNumber ? "border-red-500" : ""}
                />
                {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber}</p>}
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number (Optional)</Label>
                <Input
                  id="whatsapp"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Enter user's WhatsApp number if different"
                />
                <p className="text-sm text-gray-500">Leave empty if same as phone number</p>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preferred Batch */}
              <div className="space-y-2">
                <Label htmlFor="batch">Preferred Batch</Label>
                <Select value={preferredBatch} onValueChange={setPreferredBatch}>
                  <SelectTrigger id="batch">
                    <SelectValue placeholder="Select preferred batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-preference">No preference</SelectItem>
                    <SelectItem value="morning-batch-1">Morning Batch 1 (5:30 to 6:30)</SelectItem>
                    <SelectItem value="morning-batch-2">Morning Batch 2 (6:40 to 7:40)</SelectItem>
                    <SelectItem value="morning-batch-3">Morning Batch 3 (7:50 to 8:50)</SelectItem>
                    <SelectItem value="evening-batch-4">Evening Batch 4 (5:30 to 6:30)</SelectItem>
                    <SelectItem value="evening-batch-5">Evening Batch 5 (6:40 to 7:40)</SelectItem>
                    <SelectItem value="evening-batch-6">Evening Batch 6 (7:50 to 8:50)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password Management */}
              <div className="space-y-2 mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <Label>Password Management</Label>
                    <p className="text-sm text-gray-500">Send login credentials to user's email</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={sendPasswordEmail}
                    disabled={saving || sendingEmail}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {sendingEmail ? "Sending..." : "Send Password Email"}
                  </Button>
                </div>
                {emailStatus && (
                  <Alert variant={emailStatus.type === "success" ? "default" : "destructive"}>
                    {emailStatus.type === "success" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{emailStatus.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* User Creation Date */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <Label>Account Created</Label>
                <p className="text-sm text-gray-600">
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/users")}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  )
}
