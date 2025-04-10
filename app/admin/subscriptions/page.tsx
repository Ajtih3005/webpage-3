"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface Subscription {
  id: number
  name: string
  description: string | null
  price: number
  duration_days: number
  payment_link: string | null
  is_external_link: boolean
  created_at: string
}

export default function ManageSubscriptions() {
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  async function fetchSubscriptions() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setSubscriptions(data || [])
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubscription = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subscription plan?")) return

    try {
      const supabase = getSupabaseBrowserClient()

      // Check if any courses are using this subscription
      const { count, error: countError } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("subscription_id", id)

      if (countError) throw countError

      if (count && count > 0) {
        alert(`Cannot delete this subscription plan because it is being used by ${count} courses.`)
        return
      }

      // Check if any users have this subscription
      const { count: userCount, error: userCountError } = await supabase
        .from("user_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("subscription_id", id)

      if (userCountError) throw userCountError

      if (userCount && userCount > 0) {
        alert(`Cannot delete this subscription plan because it is being used by ${userCount} users.`)
        return
      }

      // Delete the subscription
      const { error } = await supabase.from("subscriptions").delete().eq("id", id)

      if (error) throw error

      // Refresh the subscriptions list
      fetchSubscriptions()
    } catch (error) {
      console.error("Error deleting subscription:", error)
    }
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
                      <TableHead>Payment Method</TableHead>
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
                          {subscription.payment_link ? (
                            <Badge variant={subscription.is_external_link ? "outline" : "default"}>
                              {subscription.is_external_link ? "External Link" : "Online Payment"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No payment link</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
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
