"use client"

import { useEffect, useState } from "react"
import { UserLayout } from "@/components/user-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { CheckCircle2, ExternalLink } from "lucide-react"
import RazorpayPaymentButton from "@/components/razorpay-payment-button"

interface Subscription {
  id: number
  name: string
  description: string | null
  price: number
  duration_days: number
  payment_link: string | null
  is_external_link: boolean
}

interface UserSubscription {
  id: number
  subscription_id: number
  start_date: string
  end_date: string
  is_active: boolean
  subscription: Subscription
}

export default function UserSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptionsData()
  }, [])

  async function fetchSubscriptionsData() {
    try {
      setLoading(true)

      const userId = localStorage.getItem("userId")
      if (!userId) {
        throw new Error("User ID not found")
      }

      const supabase = getSupabaseBrowserClient()

      // Fetch all available subscriptions
      const { data: allSubscriptions, error: subscriptionsError } = await supabase
        .from("subscriptions")
        .select("*")
        .order("price", { ascending: true })

      if (subscriptionsError) throw subscriptionsError

      setSubscriptions(allSubscriptions || [])

      // Fetch user's subscriptions with subscription details
      const { data: userSubs, error: userSubsError } = await supabase
        .from("user_subscriptions")
        .select(`
          id,
          subscription_id,
          start_date,
          end_date,
          is_active,
          subscription:subscriptions (
            id,
            name,
            description,
            price,
            duration_days,
            payment_link,
            is_external_link
          )
        `)
        .eq("user_id", userId)
        .order("end_date", { ascending: false })

      if (userSubsError) throw userSubsError

      setUserSubscriptions(userSubs || [])
    } catch (error) {
      console.error("Error fetching subscriptions data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Update the hasActiveSubscription function to not prevent subscribing to the same plan multiple times
  const hasActiveSubscription = (subscriptionId: number) => {
    // We're removing this check to allow multiple subscriptions of the same type
    // Just return false to always allow subscribing
    return false
  }

  const handleSubscribeExternal = (subscription: Subscription) => {
    if (subscription.payment_link) {
      // Open payment link in a new tab
      window.open(subscription.payment_link, "_blank")
    } else {
      // Show message that admin needs to be contacted
      alert("Please contact the administrator to subscribe to this plan.")
    }
  }

  const handlePaymentSuccess = () => {
    // Refresh subscription data after successful payment
    fetchSubscriptionsData()
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Subscriptions</h1>

        {/* Available Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>Choose a subscription plan to access premium courses</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading subscription plans...</p>
            ) : subscriptions.length === 0 ? (
              <p className="text-muted-foreground">No subscription plans available.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {subscriptions.map((subscription) => {
                  const activeSubscriptionsOfType = userSubscriptions.filter(
                    (sub) => sub.subscription_id === subscription.id && sub.is_active,
                  )
                  const activeCount = activeSubscriptionsOfType.length
                  const isActive = activeCount > 0

                  return (
                    <Card key={subscription.id} className={isActive ? "border-primary" : ""}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle>{subscription.name}</CardTitle>
                          {isActive && (
                            <Badge className="bg-primary">{activeCount > 1 ? `${activeCount} Active` : "Active"}</Badge>
                          )}
                        </div>
                        <CardDescription>{subscription.duration_days} days</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <span className="text-3xl font-bold">₹{subscription.price.toFixed(2)}</span>
                        </div>
                        {subscription.description && <p className="text-sm mb-4">{subscription.description}</p>}
                        {isActive && (
                          <div className="flex items-center text-primary text-sm">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            <span>
                              You have{" "}
                              {activeCount > 1 ? `${activeCount} active subscriptions` : "an active subscription"}
                            </span>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        {subscription.is_external_link && subscription.payment_link ? (
                          // External payment link button - always enabled now
                          <Button className="w-full" onClick={() => handleSubscribeExternal(subscription)}>
                            Subscribe Now
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        ) : (
                          // Razorpay integration button - always enabled now
                          <RazorpayPaymentButton
                            subscriptionId={subscription.id}
                            subscriptionName={subscription.name}
                            amount={subscription.price}
                            duration_days={subscription.duration_days}
                            onSuccess={handlePaymentSuccess}
                            buttonText="Subscribe Now"
                          />
                        )}
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription History */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription History</CardTitle>
            <CardDescription>Your past and current subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading subscription history...</p>
            ) : userSubscriptions.length === 0 ? (
              <p className="text-muted-foreground">You don't have any subscriptions yet.</p>
            ) : (
              <div className="space-y-4">
                {userSubscriptions.map((userSub) => (
                  <div key={userSub.id} className="flex items-start p-4 border rounded-md">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="font-medium">{userSub.subscription.name}</h3>
                        {userSub.is_active && <Badge className="ml-2 bg-primary">Active</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(userSub.start_date)} - {formatDate(userSub.end_date)}
                      </p>
                      <p className="text-sm mt-1">Price: ₹{userSub.subscription.price.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      {userSub.is_active ? (
                        <p className="text-xs text-green-600">Expires on {formatDate(userSub.end_date)}</p>
                      ) : (
                        <p className="text-xs text-gray-500">Expired on {formatDate(userSub.end_date)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  )
}
