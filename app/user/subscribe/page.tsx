"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard, CheckCircle, ArrowLeft, Leaf, Star, Clock, Gift } from "lucide-react"
import { RazorpayPayment } from "@/components/razorpay-payment"
import { isUserLoggedIn } from "@/lib/auth-client"
import { createClient } from "@/lib/supabase"

interface Subscription {
  id: number
  name: string
  description: string
  price: number
  duration_days: number
  features: string[]
  is_active: boolean
  discount_percentage?: number
  original_price?: number
}

export default function SubscribePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get("plan")

  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [error, setError] = useState("")
  const [checkingAuth, setCheckingAuth] = useState(true)

  // 🔍 Check authentication first
  useEffect(() => {
    const checkAuth = () => {
      if (!isUserLoggedIn()) {
        // Not logged in, redirect to login with current URL as redirect
        const currentUrl = window.location.pathname + window.location.search
        router.push(`/user/login?redirect=${encodeURIComponent(currentUrl)}`)
        return
      }
      setCheckingAuth(false)
    }

    checkAuth()
  }, [router])

  // 📦 Load subscription data
  useEffect(() => {
    if (checkingAuth) return

    const loadSubscription = async () => {
      if (!planId) {
        setError("No subscription plan specified")
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("id", planId)
          .eq("is_active", true)
          .single()

        if (fetchError) {
          console.error("Error fetching subscription:", fetchError)
          setError("Subscription plan not found")
          return
        }

        if (!data) {
          setError("Subscription plan not found")
          return
        }

        // Parse features if it's a string
        let features = data.features
        if (typeof features === "string") {
          try {
            features = JSON.parse(features)
          } catch {
            features = [features]
          }
        }

        setSubscription({
          ...data,
          features: Array.isArray(features) ? features : [],
        })
      } catch (err) {
        console.error("Error loading subscription:", err)
        setError("Failed to load subscription details")
      } finally {
        setLoading(false)
      }
    }

    loadSubscription()
  }, [planId, checkingAuth])

  // 🏠 Handle logo click - navigate to home
  const handleLogoClick = () => {
    router.push("/")
  }

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 forest-bg">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show loading while fetching subscription
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 forest-bg">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading subscription details...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 forest-bg">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error || "Subscription not found"}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/user/plans")} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              View Plans
            </Button>
            <Button onClick={handleLogoClick} className="flex-1">
              <Leaf className="mr-2 h-4 w-4" />
              Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const discountedPrice = subscription.discount_percentage
    ? subscription.price * (1 - subscription.discount_percentage / 100)
    : subscription.price

  return (
    <div className="min-h-screen p-4 forest-bg relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 leaf-pattern opacity-20"></div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10 opacity-30">
        <CreditCard className="h-8 w-8 text-white animate-pulse" />
      </div>
      <div className="absolute top-20 right-20 opacity-20">
        <Star className="h-12 w-12 text-white animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={handleLogoClick}
            className="inline-flex items-center space-x-3 hover:opacity-80 transition-opacity mb-6"
          >
            <div className="bg-white p-2 rounded-full shadow-lg">
              <div className="relative h-12 w-12">
                <img src="/images/logo.png" alt="Sthavishtah Logo" className="object-contain w-full h-full" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white">STHAVISHTAH</h1>
              <p className="text-white/80 text-sm tracking-widest">YOGA AND WELLNESS</p>
            </div>
          </button>
          <div className="w-24 h-1 bg-white/30 mx-auto rounded-full"></div>
        </div>

        {/* Subscription Card */}
        <Card className="nature-card shadow-2xl border-0 mb-6">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="h-6 w-6 text-green-600" />
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Premium Plan
              </Badge>
            </div>
            <CardTitle className="text-3xl font-bold forest-text-gradient">{subscription.name}</CardTitle>
            <CardDescription className="text-gray-600 text-lg">{subscription.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Pricing */}
            <div className="text-center py-6 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                {subscription.discount_percentage && (
                  <span className="text-2xl text-gray-400 line-through">₹{subscription.price}</span>
                )}
                <span className="text-4xl font-bold text-green-600">₹{Math.round(discountedPrice)}</span>
              </div>
              {subscription.discount_percentage && (
                <Badge variant="destructive" className="mb-2">
                  {subscription.discount_percentage}% OFF
                </Badge>
              )}
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{subscription.duration_days} days access</span>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                What's Included:
              </h3>
              <div className="grid gap-2">
                {subscription.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Why Choose This Plan?
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Unlimited access to all yoga sessions</li>
                <li>• Expert guidance from certified instructors</li>
                <li>• Flexible scheduling to fit your lifestyle</li>
                <li>• Progress tracking and personalized recommendations</li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {/* Payment Component */}
            <RazorpayPayment
              amount={Math.round(discountedPrice)}
              subscriptionId={subscription.id}
              subscriptionName={subscription.name}
              className="w-full"
            />

            {/* Navigation Buttons */}
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => router.push("/user/plans")} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Other Plans
              </Button>
              <Button variant="outline" onClick={handleLogoClick} className="flex-1 bg-transparent">
                <Leaf className="mr-2 h-4 w-4" />
                Home
              </Button>
            </div>

            {/* Security Notice */}
            <div className="text-center">
              <p className="text-xs text-gray-500">🔒 Secure payment powered by Razorpay • Your data is protected</p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
