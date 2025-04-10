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

interface User {
  id: number
  user_id: string
  name: string
  email: string
  phone_number: string
  whatsapp_number: string | null
  preferred_batch: string | null
  created_at: string
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchUser()
  }, [userId])

  async function fetchUser() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) throw error

      if (data) {
        setUser(data)
        setName(data.name)
        setEmail(data.email)
        setPhoneNumber(data.phone_number)
        setWhatsappNumber(data.whatsapp_number || "")
        setPreferredBatch(data.preferred_batch || "")
      }
    } catch (error) {
      console.error("Error fetching user:", error)
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
    } else if (!/^\d{10}$/.test(phoneNumber.replace(/\D/g, ""))) {
      newErrors.phoneNumber = "Please enter a valid 10-digit phone number"
    }

    if (whatsappNumber && !/^\d{10}$/.test(whatsappNumber.replace(/\D/g, ""))) {
      newErrors.whatsappNumber = "Please enter a valid 10-digit WhatsApp number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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

      const { error } = await supabase
        .from("users")
        .update({
          name,
          email,
          phone_number: phoneNumber,
          whatsapp_number: whatsappNumber || null,
          preferred_batch: preferredBatch || null,
        })
        .eq("id", userId)

      if (error) throw error

      router.push("/admin/users")
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading user data...</p>
        </div>
      </AdminLayout>
    )
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p>User not found</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit User</h1>

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
                <Input id="user-id" value={user.user_id} disabled readOnly />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter user's name"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter user's email"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter user's phone number"
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
                {errors.whatsappNumber && <p className="text-sm text-red-500">{errors.whatsappNumber}</p>}
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
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/users")}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  )
}
