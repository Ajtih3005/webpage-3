"use client"

import { useState, useEffect } from "react"
import { UserLayout } from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"
import { AlertCircle, ArrowLeft, Check, CreditCard, Info, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { RazorpayPaymentButton } from "@/components/razorpay-payment-button"

interface SubscriptionPlan {
  id: number
  name: string
  description: string
  price: number
  duration_days: number
  features?: string[]
}

export default function SubscribePage() {
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [checkingSubscription, setCheckingSubscription] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get("plan")

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId")

    if (!storedUserId) {
      router.push("/user/login")
      return
    }

    setUserId(storedUserId)

    if (!planId) {
      setError("No subscription plan selected")
      setLoading(false)
      return
    }

    async function fetchPlanAndCheckSubscription() {
      try {
        setLoading(true)
        setCheckingSubscription(true)
        const supabase = getSupabaseBrowserClient()

        // Fetch the plan details
        const { data, error } = await supabase.from("subscriptions").select("*").eq("id", planId).single()

        if (error) {
          console.error("Error fetching plan:", error)
          throw new Error(error.message)
        }

        if (!data) {
          throw new Error("Subscription plan not found")
        }

        // Process the data to add features
        let features = []

        if (data.duration_days === 30) {
          features = ["Access to all basic yoga sessions", "Monthly progress tracking", "Email support"]
        } else if (data.duration_days === 90) {
          features = [
            "Access to all basic and intermediate yoga sessions",
            "Quarterly progress tracking",
            "Priority email support",
            "Access to community forums",
          ]
        } else if (data.duration_days === 365) {
          features = [
            "Access to all yoga sessions (basic, intermediate, advanced)",
            "Annual progress tracking",
            "Priority email and phone support",
            "Access to community forums",
            "Exclusive workshops and events",
          ]
        }

        const processedPlan = {
          ...data,
          features,
        }

        setPlan(processedPlan)

        // Check if user already has an active subscription to this plan
        const { data: userSubscriptions, error: subError } = await supabase
          .from("user_subscriptions")
          .select("subscription_id, end_date, is_active")
          .eq("user_id", storedUserId)
          .eq("subscription_id", planId)

        if (subError) {
          console.error("Error checking user subscriptions:", subError)
        } else {
          // Check if any of the subscriptions are active
          const hasActive =
            userSubscriptions?.some((sub) => {
              const endDate = new Date(sub.end_date)
              const now = new Date()
              return sub.is_active || endDate > now
            }) || false

          setHasActiveSubscription(hasActive)

          if (hasActive) {
            setError("You already have an active subscription to this plan. Please choose a different plan.")
          }
        }
      } catch (err) {
        console.error("Failed to load plan:", err)
        setError("Failed to load subscription plan. Please try again later.")
      } finally {
        setLoading(false)
        setCheckingSubscription(false)
      }
    }

    fetchPlanAndCheckSubscription()
  }, [planId, router])

  if (loading || checkingSubscription) {
    return (
      <UserLayout>
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">Subscribe</h1>
          <div className="flex justify-center my-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          </div>
        </div>
      </UserLayout>
    )
  }

  if (error || !plan) {
    return (
      <UserLayout>
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">Subscribe</h1>

          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Subscription plan not found"}</AlertDescription>
          </Alert>

          <Button asChild>
            <Link href="/user/plans">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Plans
            </Link>
          </Button>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" className="mr-4" asChild>
            <Link href="/user/plans">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Plans
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Subscribe to {plan.name}</h1>
        </div>

        {hasActiveSubscription && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Already Subscribed</AlertTitle>
            <AlertDescription>
              You already have an active subscription to this plan. Please choose a different plan or continue using
              your current subscription.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>Review your subscription details before payment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>

                <div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                    <span className="text-sm text-muted-foreground ml-1">
                      {plan.duration_days === 30 && "/ month"}
                      {plan.duration_days === 90 && "/ quarter"}
                      {plan.duration_days === 365 && "/ year"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Subscription period: {plan.duration_days} days</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Features:</h4>
                  <ul className="space-y-2">
                    {plan.features?.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    By proceeding with payment, you agree to our terms and conditions, including the non-refundable
                    payment policy.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>Secure payment via Razorpay</CardDescription>
            </CardHeader>
            <CardContent>
              {hasActiveSubscription ? (
                <div className="text-center py-6">
                  <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Already Subscribed</h3>
                  <p className="text-muted-foreground mb-6">You already have an active subscription to this plan.</p>
                  <Button asChild className="w-full">
                    <Link href="/user/plans">View Other Plans</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Subscription:</span>
                      <span>{plan.name}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Duration:</span>
                      <span>{plan.duration_days} days</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(plan.price)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    {userId && plan ? (
                      <RazorpayPaymentButton
                        amount={plan.price}
                        subscriptionId={plan.id}
                        userId={userId}
                        duration={plan.duration_days}
                        buttonText="Pay Now"
                        className="w-full"
                        notes={{
                          plan_name: plan.name,
                          duration_days: plan.duration_days.toString(),
                        }}
                      />
                    ) : (
                      <Button disabled className="w-full">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </Button>
                    )}

                    <div className="flex items-center mt-4 text-sm text-muted-foreground">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <span>Secure payment powered by Razorpay</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </UserLayout>
  )
}
