"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, Trash2, Users, Layers } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { format } from "date-fns"
import { Switch } from "@/components/ui/switch"

interface Subscription {
  id: number
  name: string
  description: string | null
  price: number
  duration_days: number
  payment_link: string | null
  is_external_link: boolean
  created_at: string
  start_date?: string | null
  end_date?: string | null
  user_count?: number
  batch_count?: number
  is_active?: boolean
}

export default function ManageSubscriptions() {
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  async function toggleSubscriptionActivation(id: number, currentStatus: boolean) {
    if (!confirm(`Are you sure you want to ${currentStatus ? "deactivate" : "activate"} this subscription plan?`))
      return

    try {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase.from("subscriptions").update({ is_active: !currentStatus }).eq("id", id)

      if (error) throw error

      // Refresh the subscriptions list
      fetchSubscriptions()
    } catch (error) {
      console.error("Error toggling subscription activation:", error)
      alert("Failed to update subscription status. Please try again.")
    }
  }

  async function fetchSubscriptions() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      // Get all subscriptions
      const { data, error } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false })

      if (error) throw error

      // Get user counts and batch counts for each subscription
      const subscriptionsWithCounts = await Promise.all(
        (data || []).map(async (subscription) => {
          // Get user count
          const { count: userCount, error: userCountError } = await supabase
            .from("user_subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("subscription_id", subscription.id)
            .eq("is_active", true)

          if (userCountError) {
            console.error("Error fetching user count:", userCountError)
          }

          // Get batch count
          const { count: batchCount, error: batchCountError } = await supabase
            .from("subscription_batches")
            .select("*", { count: "exact", head: true })
            .eq("subscription_id", subscription.id)

          if (batchCountError) {
            console.error("Error fetching batch count:", batchCountError)
          }

          return {
            ...subscription,
            user_count: userCount || 0,
            batch_count: batchCount || 0,
          }
        }),
      )

      setSubscriptions(subscriptionsWithCounts)
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubscription = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subscription plan?")) return

    try {
      setIsDeleting(true)
      const supabase = getSupabaseBrowserClient()

      // Check if any courses are using this subscription
      const { count: courseCount, error: courseCountError } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("subscription_id", id)

      if (courseCountError) throw courseCountError

      // Check if any users have this subscription
      const { count: userCount, error: userCountError } = await supabase
        .from("user_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("subscription_id", id)

      if (userCountError) throw userCountError

      // Check if any payments are associated with this subscription
      const { count: paymentCount, error: paymentCountError } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("subscription_id", id)

      if (paymentCountError) throw paymentCountError

      // Show warning with detailed information
      if ((courseCount && courseCount > 0) || (userCount && userCount > 0) || (paymentCount && paymentCount > 0)) {
        const courseWarning = courseCount && courseCount > 0 ? `${courseCount} courses` : ""
        const userWarning = userCount && userCount > 0 ? `${userCount} users` : ""
        const paymentWarning = paymentCount && paymentCount > 0 ? `${paymentCount} payment records` : ""

        // Build the warning message with proper separators
        const warningParts = []
        if (courseWarning) warningParts.push(courseWarning)
        if (userWarning) warningParts.push(userWarning)
        if (paymentWarning) warningParts.push(paymentWarning)

        let warningText = ""
        if (warningParts.length === 1) {
          warningText = warningParts[0]
        } else if (warningParts.length === 2) {
          warningText = `${warningParts[0]} and ${warningParts[1]}`
        } else if (warningParts.length === 3) {
          warningText = `${warningParts[0]}, ${warningParts[1]}, and ${warningParts[2]}`
        }

        const warningMessage = `Warning: This subscription is being used by ${warningText}. 
        All related data will be updated or removed. This action cannot be undone. Are you sure you want to proceed?`

        if (!confirm(warningMessage)) {
          setIsDeleting(false)
          return
        }
      }

      // Begin transaction to handle all related deletions
      // 1. First, handle payments table - update subscription_id to null
      if (paymentCount && paymentCount > 0) {
        const { error: updatePaymentsError } = await supabase
          .from("payments")
          .update({ subscription_id: null })
          .eq("subscription_id", id)

        if (updatePaymentsError) {
          // If we can't set to null (e.g., if the column is NOT NULL),
          // we need to handle this differently
          console.error("Error updating payments:", updatePaymentsError)
          throw new Error(
            `Cannot delete subscription because it's linked to payment records. Error: ${updatePaymentsError.message}`,
          )
        }
      }

      // 2. Remove all user_subscriptions records
      if (userCount && userCount > 0) {
        const { error: deleteUserSubsError } = await supabase
          .from("user_subscriptions")
          .delete()
          .eq("subscription_id", id)

        if (deleteUserSubsError) throw deleteUserSubsError
      }

      // 3. Update any courses using this subscription to null
      if (courseCount && courseCount > 0) {
        const { error: updateCoursesError } = await supabase
          .from("courses")
          .update({ subscription_id: null })
          .eq("subscription_id", id)

        if (updateCoursesError) throw updateCoursesError
      }

      // 4. Delete any subscription batches
      const { error: deleteBatchesError } = await supabase
        .from("subscription_batches")
        .delete()
        .eq("subscription_id", id)

      if (deleteBatchesError) throw deleteBatchesError

      // 5. Check for any other tables that might reference this subscription
      // Handle razorpay_orders if they exist
      try {
        const { count: orderCount } = await supabase
          .from("razorpay_orders")
          .select("*", { count: "exact", head: true })
          .eq("subscription_id", id)

        if (orderCount && orderCount > 0) {
          const { error: updateOrdersError } = await supabase
            .from("razorpay_orders")
            .update({ subscription_id: null })
            .eq("subscription_id", id)

          if (updateOrdersError) throw updateOrdersError
        }
      } catch (error) {
        // If the table doesn't exist, just continue
        console.log("Note: razorpay_orders table might not exist or have different structure")
      }

      // 6. Finally delete the subscription itself
      const { error } = await supabase.from("subscriptions").delete().eq("id", id)

      if (error) throw error

      alert("Subscription and all related data successfully deleted.")
      // Refresh the subscriptions list
      fetchSubscriptions()
    } catch (error) {
      console.error("Error deleting subscription:", error)
      alert("Error deleting subscription: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsDeleting(false)
    }
  }

  const viewSubscriptionUsers = (id: number) => {
    router.push(`/admin/subscriptions/users/${id}`)
  }

  const manageBatches = (id: number) => {
    router.push(`/admin/subscriptions/batches/${id}`)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Subscriptions</h1>
          <Button onClick={() => router.push("/admin/subscriptions/create")}>
            <Plus className="mr-2 h-4 w-4" /> Add Subscription Plan
          </Button>
        </div>

        {/* Subscription Cards with Enhanced Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {loading ? (
            <p>Loading subscription data...</p>
          ) : (
            subscriptions.map((subscription) => (
              <Card key={subscription.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <div className="flex justify-between items-start">
                    <CardTitle>{subscription.name}</CardTitle>
                    <Badge variant="outline" className="text-white border-white">
                      {subscription.user_count} Users
                    </Badge>
                  </div>
                  <CardDescription className="text-white text-opacity-90">
                    ₹{subscription.price.toFixed(2)} for {subscription.duration_days} days
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Revenue:</span>
                      <span className="text-lg font-semibold">
                        ₹{(subscription.price * (subscription.user_count || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Batches:</span>
                      <Badge variant="outline" className="font-mono">
                        {subscription.batch_count || 0}
                      </Badge>
                    </div>
                    {subscription.description && <p className="text-sm text-gray-500">{subscription.description}</p>}
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t p-4">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => router.push(`/admin/subscriptions/view/${subscription.id}`)}
                  >
                    View Subscription
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>View, edit, and delete subscription plans</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading subscription plans...</div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-4">No subscription plans found. Create your first plan!</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Batches</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">{subscription.name}</TableCell>
                        <TableCell>₹{subscription.price.toFixed(2)}</TableCell>
                        <TableCell>{subscription.duration_days} days</TableCell>
                        <TableCell>
                          {subscription.start_date ? format(new Date(subscription.start_date), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          {subscription.end_date ? format(new Date(subscription.end_date), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{subscription.user_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{subscription.batch_count || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          {subscription.payment_link ? (
                            <Badge variant={subscription.is_external_link ? "outline" : "default"}>
                              {subscription.is_external_link ? "External Link" : "Online Payment"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No payment link</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={subscription.is_active || false}
                              onCheckedChange={() =>
                                toggleSubscriptionActivation(subscription.id, subscription.is_active || false)
                              }
                            />
                            <span>{subscription.is_active ? "Active" : "Inactive"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => viewSubscriptionUsers(subscription.id)}>
                              <Users className="h-4 w-4 mr-1" /> Users
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/subscriptions/batches/${subscription.id}`)}
                              className="mr-2"
                            >
                              <Layers className="h-4 w-4 mr-1" />
                              Batches
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => router.push(`/admin/subscriptions/edit/${subscription.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteSubscription(subscription.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
