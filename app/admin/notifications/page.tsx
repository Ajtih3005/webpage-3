"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Trash2, AlertCircle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSearchParams } from "next/navigation"

interface Notification {
  id: number
  message: string
  created_at: string
  subscription_id?: number | null
  subscription_name?: string | null
}

interface Subscription {
  id: number
  name: string
}

export default function Notifications() {
  const searchParams = useSearchParams()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
    fetchSubscriptions()

    // Check for subscription ID in URL query params
    const subscriptionParam = searchParams.get("subscription")
    if (subscriptionParam) {
      setSelectedSubscription(subscriptionParam)
    }
  }, [searchParams])

  async function fetchSubscriptions() {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.from("subscriptions").select("id, name")

      if (error) throw error
      setSubscriptions(data || [])
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
      setError("Failed to load subscriptions. Please try again.")
    }
  }

  async function fetchNotifications() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false })

      if (error) throw error

      // Fetch subscription names for notifications that have subscription_id
      const notificationsWithSubscriptions = await Promise.all(
        (data || []).map(async (notification) => {
          if (notification.subscription_id) {
            const { data: subscriptionData } = await supabase
              .from("subscriptions")
              .select("name")
              .eq("id", notification.subscription_id)
              .single()

            return {
              ...notification,
              subscription_name: subscriptionData?.name || "Unknown Subscription",
            }
          }
          return notification
        }),
      )

      setNotifications(notificationsWithSubscriptions || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setError("Failed to load notifications. Please try again.")
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

      const notificationData = {
        message,
        subscription_id: selectedSubscription ? Number.parseInt(selectedSubscription) : null,
      }

      const { data, error } = await supabase.from("notifications").insert([notificationData]).select()

      if (error) throw error

      // Add the new notification to the list
      if (data && data.length > 0) {
        // If the notification has a subscription_id, fetch the subscription name
        let newNotification = data[0]
        if (newNotification.subscription_id) {
          const { data: subscriptionData } = await supabase
            .from("subscriptions")
            .select("name")
            .eq("id", newNotification.subscription_id)
            .single()

          newNotification = {
            ...newNotification,
            subscription_name: subscriptionData?.name || "Unknown Subscription",
          }
        }

        setNotifications([newNotification, ...notifications])
      }

      // Clear the message input
      setMessage("")
    } catch (error) {
      console.error("Error sending notification:", error)
      setError("Failed to send notification. Please try again.")
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
      setError("Failed to delete notification. Please try again.")
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Notifications</h1>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Send Notification</CardTitle>
              <CardDescription>Create a new notification for users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subscription">Target Subscription (Optional)</Label>
                  <Select
                    value={selectedSubscription || ""}
                    onValueChange={(value) => setSelectedSubscription(value === "all" ? null : value)}
                  >
                    <SelectTrigger id="subscription">
                      <SelectValue placeholder="All Users (No specific subscription)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users (No specific subscription)</SelectItem>
                      {subscriptions.map((subscription) => (
                        <SelectItem key={subscription.id} value={subscription.id.toString()}>
                          {subscription.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSubscription && (
                    <p className="text-sm text-blue-600">
                      This notification will only be visible to users with the selected subscription.
                    </p>
                  )}
                </div>

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
                      <TableHead>Target</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>{notification.message}</TableCell>
                        <TableCell>
                          {notification.subscription_id ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {notification.subscription_name}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                              All Users
                            </span>
                          )}
                        </TableCell>
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
