"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { format } from "date-fns"
import { Plus, RefreshCw, Users } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface Subscription {
  id: number
  name: string
  description: string | null
  price: number
  duration_days: number
  start_date: string | null
  end_date: string | null
  is_default_for_new_users: boolean
  is_one_time_only: boolean
  user_count?: number
}

export default function ManageFreeSubscriptions() {
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchFreeSubscriptions()
  }, [])

  async function fetchFreeSubscriptions() {
    try {
      setLoading(true)
      setError(null)
      const supabase = getSupabaseBrowserClient()

      // Get all free subscriptions (price = 0)
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("price", 0)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Get user counts for each subscription
      const subscriptionsWithCounts = await Promise.all(
        (data || []).map(async (subscription) => {
          const { count, error: countError } = await supabase
            .from("user_subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("subscription_id", subscription.id)
            .eq("is_active", true)

          if (countError) {
            console.error("Error fetching user count:", countError)
            return { ...subscription, user_count: 0 }
          }

          return { ...subscription, user_count: count || 0 }
        }),
      )

      setSubscriptions(subscriptionsWithCounts)
    } catch (error) {
      console.error("Error fetching free subscriptions:", error)
      setError(error instanceof Error ? error.message : "Failed to load free subscriptions")
    } finally {
      setLoading(false)
    }
  }

  async function toggleDefaultStatus(subscription: Subscription) {
    try {
      setError(null)
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase
        .from("subscriptions")
        .update({
          is_default_for_new_users: !subscription.is_default_for_new_users,
        })
        .eq("id", subscription.id)

      if (error) throw error

      setSuccess(
        `Subscription "${subscription.name}" ${!subscription.is_default_for_new_users ? "will now" : "will no longer"} be assigned to new users`,
      )

      // Refresh the data
      fetchFreeSubscriptions()

      // Clear success message after a delay
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (error) {
      console.error("Error updating subscription:", error)
      setError(error instanceof Error ? error.message : "Failed to update subscription")
    }
  }

  async function toggleOneTimeStatus(subscription: Subscription) {
    try {
      setError(null)
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase
        .from("subscriptions")
        .update({
          is_one_time_only: !subscription.is_one_time_only,
        })
        .eq("id", subscription.id)

      if (error) throw error

      setSuccess(
        `Subscription "${subscription.name}" ${!subscription.is_one_time_only ? "will now" : "will no longer"} be one-time only`,
      )

      // Refresh the data
      fetchFreeSubscriptions()

      // Clear success message after a delay
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (error) {
      console.error("Error updating subscription:", error)
      setError(error instanceof Error ? error.message : "Failed to update subscription")
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Free Subscriptions</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchFreeSubscriptions} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button onClick={() => router.push("/admin/subscriptions/create")}>
              <Plus className="mr-2 h-4 w-4" /> Create New
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg text-gray-500 mb-4">No free subscriptions found</p>
              <Button onClick={() => router.push("/admin/subscriptions/create")}>
                <Plus className="mr-2 h-4 w-4" /> Create Free Subscription
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map((subscription) => (
              <Card
                key={subscription.id}
                className={`overflow-hidden ${
                  subscription.duration_days === 30 && subscription.is_default_for_new_users
                    ? "border-2 border-green-500"
                    : ""
                }`}
              >
                <CardHeader
                  className={`
                  bg-gradient-to-r 
                  ${
                    subscription.duration_days === 30 && subscription.is_default_for_new_users
                      ? "from-green-600 to-green-700"
                      : "from-green-500 to-teal-600"
                  } 
                  text-white`}
                >
                  <div className="flex justify-between items-start">
                    <CardTitle>{subscription.name}</CardTitle>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="text-white border-white">
                        {subscription.user_count} Users
                      </Badge>
                      {subscription.duration_days === 30 && subscription.is_default_for_new_users && (
                        <Badge variant="outline" className="bg-white text-green-700 border-white">
                          Default for New Users
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-white text-opacity-90">
                    {subscription.duration_days} days free access
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {subscription.description && <p className="text-sm text-gray-600">{subscription.description}</p>}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">
                        {subscription.start_date
                          ? format(new Date(subscription.start_date), "MMM d, yyyy")
                          : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">End Date</p>
                      <p className="font-medium">
                        {subscription.end_date
                          ? format(new Date(subscription.end_date), "MMM d, yyyy")
                          : "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor={`default-${subscription.id}`} className="font-medium">
                          Default for New Users
                        </Label>
                      </div>
                      <Switch
                        id={`default-${subscription.id}`}
                        checked={subscription.is_default_for_new_users}
                        onCheckedChange={() => toggleDefaultStatus(subscription)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor={`onetime-${subscription.id}`} className="font-medium">
                          One-Time Only
                        </Label>
                      </div>
                      <Switch
                        id={`onetime-${subscription.id}`}
                        checked={subscription.is_one_time_only}
                        onCheckedChange={() => toggleOneTimeStatus(subscription)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-gray-50 p-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/admin/subscriptions/users/${subscription.id}`)}
                  >
                    <Users className="mr-2 h-4 w-4" /> View Users
                  </Button>
                  <Button onClick={() => router.push(`/admin/subscriptions/edit/${subscription.id}`)}>
                    Edit Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
