"use client"

import { useState, useEffect } from "react"
import { UserLayout } from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { AlertCircle, Check, ChevronDown, ArrowLeft, Calendar, Clock, Users, Star, Percent } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface SubscriptionPage {
  id: string
  slug: string
  title: string
  subtitle: string
  hero_image_url?: string
  introduction_title?: string
  introduction_content?: string
  status: string
}

interface InfoCard {
  id: string
  page_id: string
  card_type: string
  title: string
  value: string
  icon?: string
  display_order: number
}

interface ContentSection {
  id: string
  page_id: string
  title: string
  content: string
  display_order: number
}

interface SubscriptionPlan {
  id: number
  name: string
  description: string
  price: number
  duration_days: number
  features?: string[] | null
  has_discount?: boolean
  discount_percentage?: number
  original_price?: number
  userHasActive?: boolean
}

export default function CategoryDetailPage({ params }: { params: { slug: string } }) {
  const [pageData, setPageData] = useState<SubscriptionPage | null>(null)
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [infoCards, setInfoCards] = useState<InfoCard[]>([])
  const [contentSections, setContentSections] = useState<ContentSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem("userId")

    if (!userId) {
      router.push("/user/login")
      return
    }

    async function fetchCategoryData() {
      try {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Get page details
        const { data: page, error: pageError } = await supabase
          .from("subscription_pages")
          .select("*")
          .eq("slug", params.slug)
          .eq("status", "published")
          .single()

        if (pageError) {
          console.error("Error fetching page:", pageError)
          throw new Error("Subscription category not found")
        }

        setPageData(page)

        // Get linked subscription plans
        const { data: linkedPlans, error: plansError } = await supabase
          .from("subscription_page_plans")
          .select(`
            subscription_id,
            display_order,
            subscriptions (*)
          `)
          .eq("page_id", page.id)
          .order("display_order")

        let plans: SubscriptionPlan[] = []

        if (linkedPlans && linkedPlans.length > 0) {
          // Use linked plans
          plans = linkedPlans.map((lp) => lp.subscriptions).filter(Boolean)
        } else {
          // Fallback: show all available subscription plans
          const { data: allPlans, error: allPlansError } = await supabase
            .from("subscriptions")
            .select("*")
            .gt("price", 0)
            .order("price", { ascending: true })

          if (!allPlansError && allPlans) {
            plans = allPlans
          }
        }

        // Check user's active subscriptions
        const { data: userSubscriptions } = await supabase
          .from("user_subscriptions")
          .select("subscription_id, end_date, is_active")
          .eq("user_id", userId)

        // Process plans with user subscription status
        const processedPlans = plans.map((plan) => {
          const hasActiveSubscription =
            userSubscriptions?.some((sub) => {
              const endDate = new Date(sub.end_date)
              const now = new Date()
              return sub.subscription_id === plan.id && (sub.is_active || endDate > now)
            }) || false

          return {
            ...plan,
            userHasActive: hasActiveSubscription,
          }
        })

        setSubscriptionPlans(processedPlans)

        // Get info cards
        const { data: cards, error: cardsError } = await supabase
          .from("subscription_page_cards")
          .select("*")
          .eq("page_id", page.id)
          .order("display_order")

        if (!cardsError && cards) {
          setInfoCards(cards)
        }

        // Get content sections
        const { data: sections, error: sectionsError } = await supabase
          .from("subscription_page_sections")
          .select("*")
          .eq("page_id", page.id)
          .order("display_order")

        if (!sectionsError && sections) {
          setContentSections(sections)
        }
      } catch (err) {
        console.error("Failed to load category data:", err)
        setError("Failed to load subscription category. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryData()
  }, [params.slug, router])

  const getSubscriptionPeriod = (durationDays: number) => {
    if (durationDays === 30) return "Monthly"
    if (durationDays === 90) return "Quarterly"
    if (durationDays === 365) return "Annual"
    return `${durationDays} Days`
  }

  const formatWholePrice = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case "calendar":
        return <Calendar className="h-6 w-6" />
      case "clock":
        return <Clock className="h-6 w-6" />
      case "users":
        return <Users className="h-6 w-6" />
      case "star":
        return <Star className="h-6 w-6" />
      default:
        return <Star className="h-6 w-6" />
    }
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center my-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          </div>
        </div>
      </UserLayout>
    )
  }

  if (error || !pageData) {
    return (
      <UserLayout>
        <div className="container mx-auto py-6">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Subscription category not found"}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/user/plans")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Programs
          </Button>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="container mx-auto py-6">
        {/* Back Button */}
        <Button onClick={() => router.push("/user/plans")} variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Programs
        </Button>

        {/* Hero Section */}
        <div className="relative h-64 md:h-80 mb-8 rounded-lg overflow-hidden">
          <Image
            src={pageData.hero_image_url || "/images/default-hero.jpg"}
            alt={pageData.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
          <div className="absolute inset-0 flex items-center justify-center text-white text-center">
            <div className="max-w-3xl px-4">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">{pageData.title}</h1>
              <p className="text-lg md:text-xl opacity-90">{pageData.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Introduction */}
        {pageData.introduction_content && (
          <div className="mb-8 text-center max-w-4xl mx-auto">
            {pageData.introduction_title && (
              <h2 className="text-2xl md:text-3xl font-bold mb-4">{pageData.introduction_title}</h2>
            )}
            <p className="text-gray-600 text-lg leading-relaxed">{pageData.introduction_content}</p>
          </div>
        )}

        {/* Info Cards */}
        {infoCards.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {infoCards.map((card) => (
              <Card key={card.id} className="text-center p-6 hover:shadow-md transition-shadow">
                <div className="text-green-600 mb-3 flex justify-center">{getIconComponent(card.icon)}</div>
                <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
                <p className="text-gray-600">{card.value}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Content Sections */}
        {contentSections.length > 0 && (
          <div className="mb-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Program Details</h2>
            <div className="space-y-4">
              {contentSections.map((section) => (
                <Collapsible key={section.id}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <h3 className="text-lg font-semibold text-left">{section.title}</h3>
                    <ChevronDown className="h-5 w-5 transition-transform ui-open:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 border border-t-0 rounded-b-lg bg-white">
                    <div
                      className="prose prose-gray max-w-none"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Choose Your Plan</h2>

          {subscriptionPlans.length === 0 ? (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Plans Available</AlertTitle>
              <AlertDescription>
                There are currently no subscription plans available for this category. Please check back later.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => (
                <Card key={plan.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-2 bg-green-600 w-full"></div>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {plan.name}
                      <Badge variant="secondary">{getSubscriptionPeriod(plan.duration_days)}</Badge>
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      {plan.has_discount && plan.original_price && plan.discount_percentage ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-muted-foreground line-through">
                              {formatWholePrice(plan.original_price)}
                            </span>
                            <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1">
                              <Percent className="h-3 w-3" />
                              {plan.discount_percentage}% OFF
                            </Badge>
                          </div>
                          <span className="text-3xl font-bold text-green-700">{formatWholePrice(plan.price)}</span>
                        </div>
                      ) : (
                        <span className="text-3xl font-bold">{formatWholePrice(plan.price)}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-medium text-sm mb-3 text-green-700">What's included:</h4>
                    <ul className="space-y-2">
                      {plan.features?.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.userHasActive && (
                      <Alert className="mt-4 bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-700">
                          You already have an active subscription to this plan.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => router.push(`/user/subscribe?plan=${plan.id}`)}
                      disabled={plan.userHasActive}
                    >
                      {plan.userHasActive ? "Already Subscribed" : "Choose This Plan"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-green-50 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Ready to Start Your Journey?</h3>
            <p className="text-gray-600 mb-6">
              Join thousands of others who have transformed their lives through our programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push("/user/contact")}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
              >
                Have Questions?
              </Button>
              <Button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="bg-green-600 hover:bg-green-700"
              >
                View Plans Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
