"use client"

import { useState, useEffect } from "react"
import { UserLayout } from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import {
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Info,
  Package,
  Check,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

interface Subscription {
  id: string
  user_id: string
  subscription_id: string
  start_date: string
  end_date: string
  is_active: boolean
  activation_date: string | null
  admin_activated: boolean
  last_activation_date: string | null
  total_active_days: number | null
  subscription?: {
    id: string
    name: string
    description: string
    price: number
    duration_days: number
    features?: string[] | null
    features_list?: string[] | null
    has_discount?: boolean
    discount_percentage?: number
    original_price?: number
    is_active?: boolean
  }
}

export default function UserSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [activeSubscriptions, setActiveSubscriptions] = useState<Subscription[]>([])
  const [expiredSubscriptions, setExpiredSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem("userId")

    if (!userId) {
      router.push("/user/login")
      return
    }

    async function fetchUserSubscriptions() {
      try {
        setLoading(true)

        // Create a new Supabase client instance
        const supabase = getSupabaseBrowserClient()

        // Get user subscriptions
        const { data: userSubs, error: userSubsError } = await supabase
          .from("user_subscriptions")
          .select(`
            id,
            user_id,
            subscription_id,
            start_date,
            end_date,
            is_active,
            activation_date,
            admin_activated,
            last_activation_date,
            total_active_days,
            subscription:subscriptions (
              id, 
              name, 
              description, 
              price, 
              duration_days, 
              features,
              features_list,
              has_discount,
              discount_percentage,
              original_price,
              is_active
            )
          `)
          .eq("user_id", userId)
          .order("end_date", { ascending: false })

        if (userSubsError) {
          console.error("Error fetching user subscriptions:", userSubsError)
          throw new Error(`Supabase error: ${userSubsError.message}`)
        }

        if (!userSubs || userSubs.length === 0) {
          setSubscriptions([])
          setActiveSubscriptions([])
          setExpiredSubscriptions([])
          setLoading(false)
          return
        }

        setSubscriptions(userSubs)

        // Sort into current and expired
        const now = new Date()

        // Expired subscriptions: end_date is in the past
        const expired = userSubs.filter((sub) => {
          const endDate = new Date(sub.end_date)
          return endDate <= now
        })

        // For non-expired subscriptions, check if they're active or inactive
        const current = userSubs.filter((sub) => {
          const endDate = new Date(sub.end_date)
          return endDate > now
        })

        // Active subscriptions: both user subscription and plan are active
        const active = current.filter((sub) => {
          return sub.is_active === true && sub.subscription?.is_active === true
        })

        setActiveSubscriptions(active)
        setExpiredSubscriptions(expired)
      } catch (err) {
        console.error("Failed to load subscriptions:", err)
        setError("Failed to load your subscriptions. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchUserSubscriptions()
  }, [router])

  // Calculate time remaining for a subscription
  const getTimeRemaining = (subscription: Subscription) => {
    // Don't show remaining time if the subscription is inactive
    if (!isSubscriptionActive(subscription)) {
      return "Pending activation"
    }

    // Calculate remaining time based on total_active_days
    const durationDays = subscription.subscription?.duration_days || 30
    const totalActiveDays = subscription.total_active_days || 0
    const remainingDays = durationDays - totalActiveDays

    if (remainingDays <= 0) {
      return "Expired"
    }

    if (remainingDays > 30) {
      const months = Math.floor(remainingDays / 30)
      return `${months} month${months > 1 ? "s" : ""} left`
    }

    return `${remainingDays} day${remainingDays !== 1 ? "s" : ""} left`
  }

  // Check if a subscription is truly active (both user subscription and plan are active)
  const isSubscriptionActive = (subscription: Subscription): boolean => {
    return subscription.is_active === true && subscription.subscription?.is_active === true
  }

  // Get subscription period text
  const getSubscriptionPeriod = (durationDays: number | undefined) => {
    if (!durationDays) return "Subscription"

    if (durationDays === 30) return "Monthly Subscription"
    if (durationDays === 90) return "Quarterly Subscription"
    if (durationDays === 365) return "Annual Subscription"

    return `${durationDays}-Day Subscription`
  }

  // Get default features based on subscription duration
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
    return ["Access to yoga sessions"]
  }

  // Format currency to show only whole numbers (no decimal places)
  const formatWholePrice = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get the reason why a subscription is inactive
  const getInactiveReason = (subscription: Subscription): string => {
    if (subscription.subscription?.is_active !== true) {
      return "Plan inactive"
    }
    if (subscription.is_active !== true) {
      return "Awaiting activation"
    }
    return "Pending"
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">My Subscriptions</h1>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">My Subscriptions</h1>
          <Button asChild className="flex items-center gap-2">
            <Link href="/user/plans">
              <Package className="h-4 w-4" />
              View Available Subscriptions
            </Link>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {subscriptions.length === 0 ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>No Subscriptions Found</CardTitle>
                <CardDescription>
                  You don't have any active subscriptions. Subscribe to a plan to access our premium content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="bg-green-50 p-4 rounded-full mb-4">
                    <Calendar className="h-12 w-12 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Explore Our Plans</h3>
                  <p className="text-center text-muted-foreground mb-6">
                    Choose from our range of subscription plans designed to meet your yoga journey needs.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/user/plans">Browse Subscription Plans</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <Tabs defaultValue="current">
            <TabsList className="mb-6">
              <TabsTrigger value="current">Current ({activeSubscriptions.length})</TabsTrigger>
              <TabsTrigger value="expired">Expired ({expiredSubscriptions.length})</TabsTrigger>
              <TabsTrigger value="all">All ({subscriptions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="current">
              {activeSubscriptions.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No Current Subscriptions</CardTitle>
                    <CardDescription>
                      All your subscriptions have expired. Subscribe to a new plan to continue accessing our content.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild>
                      <Link href="/user/plans">Browse Plans</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {activeSubscriptions.map((subscription) => {
                    // Check if this subscription is active
                    const isActive = isSubscriptionActive(subscription)

                    // Get the reason why this subscription is inactive (if applicable)
                    const inactiveReason = !isActive ? getInactiveReason(subscription) : null

                    // Get features from subscription or use defaults
                    const features =
                      subscription.subscription?.features ||
                      (subscription.subscription?.duration_days
                        ? getDefaultFeatures(subscription.subscription.duration_days)
                        : ["Access to yoga sessions"])

                    return (
                      <Card
                        key={subscription.id}
                        className={`overflow-hidden ${isActive ? "border-green-100" : "border-amber-100"}`}
                      >
                        <div className={`h-2 ${isActive ? "bg-green-600" : "bg-amber-500"} w-full`}></div>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between mb-2">
                            <CardTitle className="text-lg">
                              {subscription.subscription?.name || "Subscription"}
                            </CardTitle>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isActive ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {isActive ? (
                                <>
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  Inactive
                                </>
                              )}
                            </span>
                          </div>
                          <CardDescription>
                            {subscription.subscription?.description || "No description available"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 pt-2">
                            {subscription.subscription?.price !== undefined && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Price:</span>
                                {subscription.subscription.has_discount &&
                                subscription.subscription.original_price &&
                                subscription.subscription.discount_percentage ? (
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-muted-foreground line-through">
                                        {formatWholePrice(subscription.subscription.original_price)}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={`flex items-center gap-1 text-xs ${
                                          isActive ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                                        }`}
                                      >
                                        {subscription.subscription.discount_percentage}% OFF
                                      </Badge>
                                    </div>
                                    <span className="font-semibold">
                                      {formatWholePrice(subscription.subscription.price)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-semibold">
                                    {formatWholePrice(subscription.subscription.price)}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Type:</span>
                              <span className={isActive ? "text-green-600" : "text-amber-600"}>
                                {getSubscriptionPeriod(subscription.subscription?.duration_days)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">
                                {!isActive ? "Registration Date:" : "Start Date:"}
                              </span>
                              <span>{formatDate(subscription.start_date)}</span>
                            </div>
                            {!isActive && subscription.activation_date && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Activation Date:</span>
                                <span className="text-amber-600 font-medium">
                                  {formatDate(subscription.activation_date)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">End Date:</span>
                              <span>{formatDate(subscription.end_date)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Status:</span>
                              {isActive ? (
                                <span className="text-green-600 font-medium flex items-center">
                                  <Clock className="mr-1 h-4 w-4" />
                                  {getTimeRemaining(subscription)}
                                </span>
                              ) : (
                                <span className="text-amber-600 font-medium">{inactiveReason}</span>
                              )}
                            </div>
                          </div>

                          {/* Features section */}
                          {features && features.length > 0 && (
                            <div className={`mt-4 pt-4 border-t ${isActive ? "border-green-100" : "border-amber-100"}`}>
                              <h4
                                className={`font-medium text-sm mb-3 ${isActive ? "text-green-700" : "text-amber-700"}`}
                              >
                                What's included:
                              </h4>
                              <ul className="space-y-2">
                                {features.map((feature, index) => (
                                  <li key={index} className="flex items-start">
                                    <Check
                                      className={`h-4 w-4 mr-2 shrink-0 mt-0.5 ${isActive ? "text-green-500" : "text-amber-500"}`}
                                    />
                                    <span className={`text-sm ${isActive ? "" : "text-gray-500"}`}>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="pt-2">
                          {isActive ? (
                            <div className="flex justify-between gap-2 w-full">
                              <Button variant="outline" size="sm" className="flex-1" asChild>
                                <Link href="/user/access-course">
                                  <Calendar className="mr-1 h-4 w-4" />
                                  Access Content
                                </Link>
                              </Button>
                              <Button size="sm" className="flex-1" asChild>
                                <Link href="/user/dashboard">Dashboard</Link>
                              </Button>
                            </div>
                          ) : (
                            <Alert className="w-full bg-amber-50 border-amber-100">
                              <Info className="h-4 w-4 text-amber-600" />
                              <AlertDescription className="text-amber-700 text-xs">
                                {subscription.subscription?.is_active !== true
                                  ? "This subscription plan is currently inactive. You'll be notified when it becomes available."
                                  : "This subscription is awaiting activation. You'll be notified when it becomes active."}
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="expired">
              {expiredSubscriptions.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No Expired Subscriptions</CardTitle>
                    <CardDescription>You don't have any expired subscriptions.</CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {expiredSubscriptions.map((subscription) => (
                    <Card key={subscription.id} className="overflow-hidden border-gray-200">
                      <div className="h-2 bg-gray-300 w-full"></div>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-lg text-gray-600">
                            {subscription.subscription?.name || "Subscription"}
                          </CardTitle>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <XCircle className="mr-1 h-3 w-3" />
                            Expired
                          </span>
                        </div>
                        <CardDescription>
                          {subscription.subscription?.description || "No description available"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 pt-2">
                          {subscription.subscription?.price !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-500">Price:</span>
                              <span>{formatWholePrice(subscription.subscription.price)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Type:</span>
                            <span className="text-gray-600">
                              {getSubscriptionPeriod(subscription.subscription?.duration_days)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Start Date:</span>
                            <span>{formatDate(subscription.activation_date || subscription.start_date)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">End Date:</span>
                            <span>{formatDate(subscription.end_date)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Status:</span>
                            <span className="text-red-500">Expired on {formatDate(subscription.end_date)}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button className="w-full" asChild>
                          <Link href="/user/plans">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Renew Subscription
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all">
              {subscriptions.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No Subscriptions Found</CardTitle>
                    <CardDescription>You don't have any subscriptions in our records.</CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {subscriptions.map((subscription) => {
                    // Determine subscription status
                    const now = new Date()
                    const endDate = new Date(subscription.end_date)
                    const isExpired = endDate <= now
                    const isActive = !isExpired && isSubscriptionActive(subscription)
                    const isInactive = !isExpired && !isActive

                    // Get the reason why this subscription is inactive (if applicable)
                    const inactiveReason = isInactive ? getInactiveReason(subscription) : null

                    // Get features from subscription or use defaults
                    const features =
                      subscription.subscription?.features ||
                      (subscription.subscription?.duration_days
                        ? getDefaultFeatures(subscription.subscription.duration_days)
                        : ["Access to yoga sessions"])

                    return (
                      <Card
                        key={subscription.id}
                        className={`overflow-hidden ${
                          isActive ? "border-green-100" : isInactive ? "border-amber-100" : "border-gray-200"
                        }`}
                      >
                        <div
                          className={`h-2 ${
                            isActive ? "bg-green-600" : isInactive ? "bg-amber-500" : "bg-gray-300"
                          } w-full`}
                        ></div>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between mb-2">
                            <CardTitle className={`text-lg ${isExpired && "text-gray-600"}`}>
                              {subscription.subscription?.name || "Subscription"}
                            </CardTitle>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isActive
                                  ? "bg-green-100 text-green-800"
                                  : isInactive
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {isActive ? (
                                <>
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Active
                                </>
                              ) : isInactive ? (
                                <>
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  Inactive
                                </>
                              ) : (
                                <>
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Expired
                                </>
                              )}
                            </span>
                          </div>
                          <CardDescription>
                            {subscription.subscription?.description || "No description available"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 pt-2">
                            {subscription.subscription?.price !== undefined && (
                              <div className="flex justify-between items-center">
                                <span className={`text-sm font-medium ${isExpired && "text-gray-500"}`}>Price:</span>
                                {subscription.subscription.has_discount &&
                                subscription.subscription.original_price &&
                                subscription.subscription.discount_percentage ? (
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-muted-foreground line-through">
                                        {formatWholePrice(subscription.subscription.original_price)}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={`flex items-center gap-1 text-xs ${
                                          isActive
                                            ? "bg-green-50 text-green-700"
                                            : isInactive
                                              ? "bg-amber-50 text-amber-700"
                                              : "bg-gray-50 text-gray-700"
                                        }`}
                                      >
                                        {subscription.subscription.discount_percentage}% OFF
                                      </Badge>
                                    </div>
                                    <span className={isActive ? "font-semibold" : ""}>
                                      {formatWholePrice(subscription.subscription.price)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className={isActive ? "font-semibold" : ""}>
                                    {formatWholePrice(subscription.subscription.price)}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className={`text-sm font-medium ${isExpired && "text-gray-500"}`}>Type:</span>
                              <span className={isActive ? "text-green-600" : "text-amber-600"}>
                                {getSubscriptionPeriod(subscription.subscription?.duration_days)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-sm font-medium ${isExpired && "text-gray-500"}`}>
                                {!isInactive ? "Start Date:" : "Registration Date:"}
                              </span>
                              <span>{formatDate(subscription.start_date)}</span>
                            </div>
                            {isInactive && subscription.activation_date && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Activation Date:</span>
                                <span>{formatDate(subscription.activation_date)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className={`text-sm font-medium ${isExpired && "text-gray-500"}`}>End Date:</span>
                              <span>{formatDate(subscription.end_date)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-sm font-medium ${isExpired && "text-gray-500"}`}>Status:</span>
                              {isActive ? (
                                <span className="text-green-600 font-medium flex items-center">
                                  <Clock className="mr-1 h-4 w-4" />
                                  {getTimeRemaining(subscription)}
                                </span>
                              ) : (
                                <span className="text-amber-600 font-medium">{inactiveReason}</span>
                              )}
                            </div>
                          </div>

                          {/* Features section */}
                          {features && features.length > 0 && (
                            <div
                              className={`mt-4 pt-4 border-t ${
                                isActive ? "border-green-100" : isInactive ? "border-amber-100" : "border-gray-200"
                              }`}
                            >
                              <h4
                                className={`font-medium text-sm mb-3 ${
                                  isActive ? "text-green-700" : isInactive ? "text-amber-700" : "text-gray-700"
                                }`}
                              >
                                {isExpired ? "What was included:" : "What's included:"}
                              </h4>
                              <ul className="space-y-2">
                                {features.map((feature, index) => (
                                  <li key={index} className="flex items-start">
                                    <Check
                                      className={`h-4 w-4 mr-2 shrink-0 mt-0.5 ${
                                        isActive ? "text-green-500" : isInactive ? "text-amber-500" : "text-gray-400"
                                      }`}
                                    />
                                    <span className={`text-sm ${isExpired && "text-gray-500"}`}>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="pt-2">
                          {isActive ? (
                            <div className="flex justify-between gap-2 w-full">
                              <Button variant="outline" size="sm" className="flex-1" asChild>
                                <Link href="/user/access-course">
                                  <Calendar className="mr-1 h-4 w-4" />
                                  Access Content
                                </Link>
                              </Button>
                              <Button size="sm" className="flex-1" asChild>
                                <Link href="/user/dashboard">Dashboard</Link>
                              </Button>
                            </div>
                          ) : (
                            <Alert className="w-full bg-amber-50 border-amber-100">
                              <Info className="h-4 w-4 text-amber-600" />
                              <AlertDescription className="text-amber-700 text-xs">
                                {subscription.subscription?.is_active !== true
                                  ? "This subscription plan is currently inactive. You'll be notified when it becomes available."
                                  : "This subscription is awaiting activation. You'll be notified when it becomes active."}
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </UserLayout>
  )
}
