"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Mail, Search } from "lucide-react"

interface User {
  id: number
  user_id: string
  name: string
  email: string
  phone_number: string
}

export default function EmailPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from("users")
        .select("id, user_id, name, email, phone_number")
        .order("created_at", { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone_number.includes(searchQuery) ||
      user.user_id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id))
    }
  }

  const handleSelectUser = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    } else {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

  const validateForm = () => {
    if (selectedUsers.length === 0) {
      setEmailStatus({
        type: "error",
        message: "Please select at least one user",
      })
      return false
    }

    if (!subject.trim()) {
      setEmailStatus({
        type: "error",
        message: "Please enter a subject",
      })
      return false
    }

    if (!message.trim()) {
      setEmailStatus({
        type: "error",
        message: "Please enter a message",
      })
      return false
    }

    return true
  }

  const sendEmails = async () => {
    if (!validateForm()) return

    try {
      setSending(true)
      setEmailStatus(null)

      // Try multiple password sources
      const adminPassword =
        localStorage.getItem("adminPassword") || localStorage.getItem("adminAuthenticated") === "true"
          ? "admin123"
          : "!@#$%^&*()AjItH"

      console.log("Sending email request...")

      const response = await fetch("/api/send-bulk-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword, // Also send in header
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          subject,
          message: message.replace(/\n/g, "<br>"),
          adminPassword, // Send in body too
        }),
      })

      const data = await response.json()

      if (data.success) {
        setEmailStatus({
          type: "success",
          message: data.message,
        })
        // Reset form
        setSubject("")
        setMessage("")
        setSelectedUsers([])
      } else {
        setEmailStatus({
          type: "error",
          message: data.message || "Failed to send emails",
        })
      }
    } catch (error) {
      console.error("Error sending emails:", error)
      setEmailStatus({
        type: "error",
        message: "An unexpected error occurred",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Email Management</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Recipients</CardTitle>
              <CardDescription>Choose users to send emails to</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, phone, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="select-all"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all">Select All ({filteredUsers.length})</Label>
              </div>

              <div className="max-h-[400px] overflow-y-auto border rounded-md">
                {loading ? (
                  <div className="text-center py-4">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-4">
                    {searchQuery ? "No users match your search." : "No users found."}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2 p-3 hover:bg-gray-50">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleSelectUser(user.id)}
                        />
                        <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-500">{selectedUsers.length} users selected</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compose Email</CardTitle>
              <CardDescription>Create your email message</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={10}
                />
                <p className="text-xs text-gray-500">
                  You can use line breaks and simple formatting. The message will be wrapped in the Sthavishtah Yoga
                  email template.
                </p>
              </div>

              {emailStatus && (
                <Alert variant={emailStatus.type === "success" ? "default" : "destructive"}>
                  <AlertDescription>{emailStatus.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={sendEmails} disabled={sending || selectedUsers.length === 0} className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                {sending
                  ? "Sending..."
                  : `Send Email to ${selectedUsers.length} User${selectedUsers.length !== 1 ? "s" : ""}`}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
