"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { UserLayout } from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Check, AlertCircle, Loader2, Star, Clock, Users, Gift } from "lucide-react"
import { RazorpayPaymentButton } from "@/components/razorpay-payment-button"

interface Subscription {
  id: number
  name: string
  description: string | null
  price: number
  duration_days: number
  features: string[] | null
  features_list: string[] | null
  has_discount: boolean
  discount_percentage: number | null
  original_price: number | null
  is_active: boolean
  whatsapp_group_link: string | null
}

export default function SubscribePage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const subscriptionId = searchParams.get("id")

  useEffect(() => {
    const userId = localStorage.getItem("userId")
    if (!userId) {
      router.push("/user/login")
      return
    }

    fetchSubscriptions()
  }, [router])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = getSupabaseBrowserClient()

      // Fetch ALL subscriptions (don't filter by is_active)
      const { data, error: fetchError } = await supabase
        .from("subscriptions")
        .select("*")
        .order("price", { ascending: true })

      if (fetchError) {
        console.error("Database error:", fetchError)
        throw new Error(`Failed to load subscription plans: ${fetchError.message}`)
      }

      if (!data || data.length === 0) {
        setError("No subscription plans are currently available. Please check back later.")
        setSubscriptions([])
        return
      }

      console.log("Fetched subscriptions:", data)
      setSubscriptions(data)

      // If a specific subscription ID is provided, select it
      if (subscriptionId) {
        const targetSubscription = data.find((sub) => sub.id.toString() === subscriptionId)
        if (targetSubscription) {
          setSelectedSubscription(targetSubscription)
        } else {
          setError(`Subscription with ID ${subscriptionId} not found.`)
        }
      }
    } catch (err) {
      console.error("Error fetching subscriptions:", err)
      setError(err instanceof Error ? err.message : "Failed to load subscription plans. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getSubscriptionPeriod = (durationDays: number) => {
    if (durationDays === 30) return "Monthly"
    if (durationDays === 90) return "Quarterly"
    if (durationDays === 365) return "Annual"
    return `${durationDays} Days`
  }

  const getDefaultFeatures = (durationDays: number) => {
    if (durationDays === 30) {
      return ["Access to all basic yoga sessions", "Monthly progress tracking", "Email support"]
    } else if (durationDays === 90) {
      return [
        "Access to all basic and intermediate yoga sessions",
        "Quarterly progress tracking",
        "Priority email support",
        "Access to community forums",
      ]
    } else if (durationDays === 365) {
      return [
        "Access to all yoga sessions (basic, intermediate, advanced)",
        "Annual progress tracking",
        "Priority email and phone support",
        "Access to community forums",
        "Exclusive workshops and events",
      ]
    }
    return ["Access to yoga sessions", "Progress tracking", "Email support"]
  }

  const getPopularBadge = (durationDays: number) => {
    if (durationDays === 90) return "Most Popular"
    if (durationDays === 365) return "Best Value"
    return null
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
              <p className="text-gray-600">Loading subscription plans...</p>
            </div>
          </div>
        </div>
      </UserLayout>
    )
  }

  if (error) {
    return (
      <UserLayout>
        <div className="container mx-auto py-8">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Subscriptions</AlertTitle>
            <AlertDescription className="mt-2">
              {error}
              <Button
                variant="outline"
                size="sm"
                className="mt-3 ml-0 block bg-transparent"
                onClick={fetchSubscriptions}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </UserLayout>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <UserLayout>
        <div className="container mx-auto py-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="bg-gray-50 p-8 rounded-lg">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Plans Available</h2>
              <p className="text-gray-600 mb-6">
                We're currently updating our subscription plans. Please check back soon for exciting new options!
              </p>
              <Button onClick={() => router.push("/user/dashboard")}>Return to Dashboard</Button>
            </div>
          </div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="container mx-auto py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Yoga Journey</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select the perfect subscription plan that fits your wellness goals and schedule
          </p>
        </div>

        {selectedSubscription && (
          <Alert className="mb-8 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Selected Plan</AlertTitle>
            <AlertDescription className="text-blue-700">
              You've selected the <strong>{selectedSubscription.name}</strong> plan. You can change your selection below
              or proceed with payment.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {subscriptions.map((subscription) => {
            const features =
              subscription.features || subscription.features_list || getDefaultFeatures(subscription.duration_days)
            const popularBadge = getPopularBadge(subscription.duration_days)
            const isSelected = selectedSubscription?.id === subscription.id
            const isInactive = !subscription.is_active

            return (
              <Card
                key={subscription.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  isSelected ? "ring-2 ring-green-500 shadow-lg" : ""
                } ${isInactive ? "opacity-75" : ""}`}
              >
                {popularBadge && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-400 to-pink-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                    {popularBadge}
                  </div>
                )}

                {isInactive && (
                  <div className="absolute top-0 left-0 bg-gray-500 text-white px-3 py-1 text-xs font-semibold rounded-br-lg">
                    Currently Unavailable
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <div className="flex items-center justify-center mb-2">
                    <div className="bg-green-100 p-3 rounded-full">
                      <Star className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{subscription.name}</CardTitle>
                  <CardDescription className="text-gray-600 min-h-[3rem] flex items-center justify-center">
                    {subscription.description ||
                      `Perfect for your ${getSubscriptionPeriod(subscription.duration_days).toLowerCase()} yoga practice`}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-center pb-6">
                  <div className="mb-6">
                    {subscription.has_discount && subscription.original_price && subscription.discount_percentage ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl text-gray-500 line-through">
                            {formatPrice(subscription.original_price)}
                          </span>
                          <Badge variant="destructive" className="bg-red-500">
                            {subscription.discount_percentage}% OFF
                          </Badge>
                        </div>
                        <div className="text-4xl font-bold text-green-600">{formatPrice(subscription.price)}</div>
                        <div className="text-sm text-gray-500">
                          You save {formatPrice(subscription.original_price - subscription.price)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold text-green-600">{formatPrice(subscription.price)}</div>
                    )}
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{getSubscriptionPeriod(subscription.duration_days)} Plan</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">{subscription.duration_days} days of access</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-left">
                    <h4 className="font-semibold text-center text-gray-900 mb-3">What's included:</h4>
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {subscription.whatsapp_group_link && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700 font-medium">
                        ✨ Includes access to exclusive WhatsApp community
                      </p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-0">
                  {isInactive ? (
                    <Button disabled className="w-full">
                      Currently Unavailable
                    </Button>
                  ) : isSelected ? (
                    <div className="w-full space-y-2">
                      <RazorpayPaymentButton
                        subscriptionId={subscription.id}
                        amount={subscription.price}
                        subscriptionName={subscription.name}
                        className="w-full"
                      />
                      <Button variant="outline" onClick={() => setSelectedSubscription(null)} className="w-full">
                        Choose Different Plan
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setSelectedSubscription(subscription)}
                      className="w-full"
                      variant={popularBadge ? "default" : "outline"}
                    >
                      Select This Plan
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-gray-50 p-6 rounded-lg max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help Choosing?</h3>
            <p className="text-gray-600 mb-4">
              Our team is here to help you find the perfect plan for your yoga journey.
            </p>
            <Button variant="outline" onClick={() => router.push("/user/contact")}>
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
