"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Trash2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface Notification {
  id: number
  message: string
  created_at: string
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setNotifications(data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) return

    try {
      setSending(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("notifications").insert([{ message }]).select()

      if (error) throw error

      // Add the new notification to the list
      if (data && data.length > 0) {
        setNotifications([data[0], ...notifications])
      }

      // Clear the message input
      setMessage("")
    } catch (error) {
      console.error("Error sending notification:", error)
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this notification?")) return

    try {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase.from("notifications").delete().eq("id", id)

      if (error) throw error

      // Remove the deleted notification from the list
      setNotifications(notifications.filter((notification) => notification.id !== id))
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Notifications</h1>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Send Notification</CardTitle>
              <CardDescription>Create a new notification for all users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="message">Notification Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your notification message here..."
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={sending || !message.trim()} className="ml-auto">
                {sending ? "Sending..." : "Send Notification"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>View and manage notifications sent to users</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-4">No notifications found.</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>{notification.message}</TableCell>
                        <TableCell>{new Date(notification.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(notification.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
