"use client"

import { useState, useEffect } from "react"
import { UserLayout } from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"
import { AlertCircle, AlertTriangle, Check, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SubscriptionPlan {
  id: number
  name: string
  description: string
  price: number
  duration_days: number
  features?: string[]
  userHasActive?: boolean
}

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem("userId")

    if (!userId) {
      router.push("/user/login")
      return
    }

    async function fetchPlans() {
      try {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Fetch all subscription plans EXCEPT free ones (price > 0)
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .gt("price", 0) // Only get paid subscriptions
          .order("price", { ascending: true })

        if (error) {
          console.error("Error fetching plans:", error)
          throw new Error(error.message)
        }

        // Fetch user's active subscriptions
        const { data: userSubscriptions, error: subError } = await supabase
          .from("user_subscriptions")
          .select("subscription_id, end_date, is_active")
          .eq("user_id", userId)

        if (subError) {
          console.error("Error fetching user subscriptions:", subError)
        }

        // Process the data to add features and check if user already has active subscription
        const processedPlans = data.map((plan) => {
          let features = []

          if (plan.duration_days === 30) {
            features = ["Access to all basic yoga sessions", "Monthly progress tracking", "Email support"]
          } else if (plan.duration_days === 90) {
            features = [
              "Access to all basic and intermediate yoga sessions",
              "Quarterly progress tracking",
              "Priority email support",
              "Access to community forums",
            ]
          } else if (plan.duration_days === 365) {
            features = [
              "Access to all yoga sessions (basic, intermediate, advanced)",
              "Annual progress tracking",
              "Priority email and phone support",
              "Access to community forums",
              "Exclusive workshops and events",
            ]
          }

          // Check if user already has this subscription active
          const hasActiveSubscription =
            userSubscriptions?.some((sub) => {
              // Consider a subscription active if:
              // 1. The subscription_id matches AND
              // 2. Either is_active is true OR end_date is in the future
              const endDate = new Date(sub.end_date)
              const now = new Date()
              return sub.subscription_id === plan.id && (sub.is_active || endDate > now)
            }) || false

          return {
            ...plan,
            features,
            userHasActive: hasActiveSubscription,
          }
        })

        setPlans(processedPlans)
      } catch (err) {
        console.error("Failed to load plans:", err)
        setError("Failed to load subscription plans. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [router])

  const handleSubscribe = (planId: number) => {
    if (!termsAccepted) {
      return
    }

    // Check if user already has this plan active
    const plan = plans.find((p) => p.id === planId)
    if (plan?.userHasActive) {
      setError("You already have an active subscription to this plan.")
      return
    }

    router.push(`/user/subscribe?plan=${planId}`)
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">Subscription Plans</h1>
          <div className="flex justify-center my-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          </div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Subscription Plans</h1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-gray-50 p-6 rounded-lg border mb-6">
          <h2 className="text-xl font-semibold mb-4">Terms and Conditions</h2>

          <Alert variant="destructive" className="mb-6 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800 text-lg font-bold">Important Notice</AlertTitle>
            <AlertDescription className="text-amber-700 font-medium">
              All subscription payments are non-refundable unless specifically stated as part of a special offer. Please
              review your subscription details carefully before making a purchase.
            </AlertDescription>
          </Alert>

          <p className="mb-4">
            Before subscribing, please review our{" "}
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-green-600 hover:underline font-medium">Terms and Conditions</button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Sthavishtah Yoga and Wellness - Terms and Conditions</DialogTitle>
                  <DialogDescription>Please read these terms carefully before subscribing.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] mt-4">
                  <div className="space-y-4 p-1">
                    <h3 className="text-lg font-semibold">1. Account Security and Credential Sharing</h3>
                    <p>
                      You agree not to share your account credentials (username, password, access tokens) with any other
                      person. Your account is for your personal use only, and sharing access credentials is strictly
                      prohibited and may result in immediate termination of your subscription without refund.
                    </p>

                    <h3 className="text-lg font-semibold">2. No Sharing of Links</h3>
                    <p>
                      All access links, session links, and private URLs provided to you through our platform are
                      strictly for your personal use. Sharing these links with others, posting them publicly, or
                      distributing them in any way is prohibited and constitutes a violation of these terms.
                    </p>

                    <h3 className="text-lg font-semibold">3. Confidentiality of Inside Information</h3>
                    <p>
                      Any inside information, proprietary techniques, or exclusive content shared during sessions or
                      through our platform is confidential. You agree not to share, distribute, or publish this
                      information through any medium including social media, blogs, or other platforms.
                    </p>

                    <h3 className="text-lg font-semibold">4. Payment and Refund Policy</h3>
                    <p>
                      <strong>All payments made for subscriptions are non-refundable</strong> unless specifically stated
                      as part of a special offer. If a special offer includes a refund option, the specific terms of
                      that refund will be clearly stated with the offer. By proceeding with payment, you acknowledge and
                      agree to this refund policy.
                    </p>

                    <h3 className="text-lg font-semibold">5. Prohibited Use of Content</h3>
                    <p>
                      You agree not to misuse, copy, record, download, redistribute, or modify any data, videos, or
                      content provided through our platform. All content is protected by copyright and other
                      intellectual property laws. Any unauthorized use, reproduction, or distribution is strictly
                      prohibited.
                    </p>

                    <h3 className="text-lg font-semibold">6. Subscription Terms</h3>
                    <p>
                      Your subscription is valid for the period specified at the time of purchase. Access to premium
                      content will automatically expire at the end of your subscription period unless renewed.
                    </p>

                    <h3 className="text-lg font-semibold">7. Code of Conduct</h3>
                    <p>
                      You agree to behave respectfully during live sessions and in any community interactions.
                      Harassment, inappropriate behavior, or disruptive actions may result in termination of your
                      subscription without refund.
                    </p>

                    <h3 className="text-lg font-semibold">8. Technical Requirements</h3>
                    <p>
                      It is your responsibility to ensure you have the necessary technical requirements (internet
                      connection, device compatibility, etc.) to access our content. Technical issues on your end do not
                      qualify for refunds.
                    </p>

                    <h3 className="text-lg font-semibold">9. Changes to Terms</h3>
                    <p>
                      We reserve the right to modify these terms at any time. Continued use of our services after such
                      changes constitutes acceptance of the new terms.
                    </p>

                    <h3 className="text-lg font-semibold">10. Privacy Policy</h3>
                    <p>
                      Your personal information will be handled in accordance with our Privacy Policy. By accepting
                      these terms, you also consent to our Privacy Policy.
                    </p>

                    <h3 className="text-lg font-semibold">11. Limitation of Liability</h3>
                    <p>
                      Sthavishtah Yoga and Wellness shall not be liable for any indirect, incidental, special,
                      consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly
                      or indirectly.
                    </p>

                    <h3 className="text-lg font-semibold">12. Governing Law</h3>
                    <p>
                      These terms and conditions are governed by and construed in accordance with the laws of India, and
                      you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                    </p>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </p>

          <div className="flex items-start space-x-3 mt-4">
            <div className="flex h-5 items-center">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              />
            </div>
            <div className="space-y-1 leading-none">
              <Label htmlFor="terms" className="font-medium">
                I agree to the Terms and Conditions of Sthavishtah Yoga and Wellness
              </Label>
              <p className="text-sm text-muted-foreground">
                By checking this box, you agree to our terms including the non-refundable payment policy and
                restrictions on sharing content.
              </p>
            </div>
          </div>

          {selectedPlan && !termsAccepted && (
            <Alert className="bg-amber-50 border-amber-200 mt-4">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                Please accept the terms and conditions to proceed with your subscription.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {plans.length === 0 ? (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>No Plans Available</AlertTitle>
            <AlertDescription>
              There are currently no subscription plans available. Please check back later.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`overflow-hidden ${selectedPlan === plan.id ? "ring-2 ring-green-500" : ""}`}
                >
                  <div className="h-2 bg-green-600 w-full"></div>
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                      <span className="text-sm text-muted-foreground ml-1">
                        {plan.duration_days === 30 && "/ month"}
                        {plan.duration_days === 90 && "/ quarter"}
                        {plan.duration_days === 365 && "/ year"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features?.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.userHasActive && (
                      <Alert className="mt-4 bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-700">
                          You already have an active subscription to this plan.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedPlan(plan.id)
                        if (termsAccepted && !plan.userHasActive) {
                          handleSubscribe(plan.id)
                        }
                      }}
                      disabled={!termsAccepted || plan.userHasActive}
                    >
                      {!termsAccepted
                        ? "Accept Terms to Subscribe"
                        : plan.userHasActive
                          ? "Already Subscribed"
                          : "Subscribe"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {selectedPlan && termsAccepted && (
              <div className="flex justify-end mt-4">
                <Button onClick={() => handleSubscribe(selectedPlan)}>Continue to Payment</Button>
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  )
}
