"use client"

import { useState, useEffect } from "react"
import { notFound, useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  ChevronDown,
  ChevronRight,
  Star,
  Users,
  Clock,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  Crown,
  Heart,
  Zap,
  Flame,
  Calendar,
  PlayCircle,
  BookOpen,
  TrendingUp,
  Home,
  FileText,
  User,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Logo } from "@/components/logo"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SubscriptionPage {
  id: string
  slug: string
  title: string
  subtitle: string
  hero_image_url: string
  introduction_title: string
  introduction_content: string
  status: string
}

interface InfoCard {
  id: string
  card_type: string
  title: string
  value: string
  icon: string
  display_order: number
}

interface ContentSection {
  id: string
  title: string
  content: string
  display_order: number
}

interface LinkedPlan {
  id: string
  subscription_id: string
  display_order: number
  subscriptions: {
    id: string
    name: string
    description: string
    price: number
    duration_days: number
    features: string[]
  }
}

interface ComparisonFeature {
  id: string
  feature_name: string
  feature_description: string | null
  display_order: number
}

interface ComparisonValue {
  feature_id: string
  subscription_plan_id: string
  is_included: boolean
  custom_value: string | null
}

export default function SubscriptionCategoryPage({ params }: { params: { slug: string } }) {
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState<SubscriptionPage | null>(null)
  const [infoCards, setInfoCards] = useState<InfoCard[]>([])
  const [contentSections, setContentSections] = useState<ContentSection[]>([])
  const [linkedPlans, setLinkedPlans] = useState<LinkedPlan[]>([])
  const [openSections, setOpenSections] = useState<string[]>([])
  const [comparisonFeatures, setComparisonFeatures] = useState<ComparisonFeature[]>([])
  const [comparisonValues, setComparisonValues] = useState<ComparisonValue[]>([])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()

  // Get the 'from' parameter to determine where user came from
  const fromUpdates = searchParams.get("from") === "updates"
  const fromLogin = searchParams.get("from") === "login"
  const fromMain = searchParams.get("from") === "main"
  const fromHome = searchParams.get("from") === "home"
  const fromPlans = searchParams.get("from") === "plans"
  const fromUserPlans = searchParams.get("from") === "user-plans"

  useEffect(() => {
    // Scroll to top immediately when component mounts
    window.scrollTo(0, 0)
    fetchPageData()
  }, [params.slug])

  const fetchPageData = async () => {
    const supabase = getSupabaseBrowserClient()
    try {
      // Fetch page details
      const { data: pageData, error: pageError } = await supabase
        .from("subscription_pages")
        .select("*")
        .eq("slug", params.slug)
        .eq("status", "published")
        .single()

      if (pageError || !pageData) {
        notFound()
        return
      }
      setPage(pageData)

      // Fetch info cards
      const { data: cardsData } = await supabase
        .from("subscription_page_cards")
        .select("*")
        .eq("page_id", pageData.id)
        .order("display_order")

      setInfoCards(cardsData || [])

      // Fetch content sections
      const { data: sectionsData } = await supabase
        .from("subscription_page_sections")
        .select("*")
        .eq("page_id", pageData.id)
        .order("display_order")

      setContentSections(sectionsData || [])

      // Fetch linked plans
      const { data: plansData } = await supabase
        .from("subscription_page_plans")
        .select(`
          id,
          subscription_id,
          display_order,
          subscriptions (
            id,
            name,
            description,
            price,
            duration_days,
            features
          )
        `)
        .eq("page_id", pageData.id)
        .order("display_order")

      setLinkedPlans(plansData || [])

      const { data: featuresData } = await supabase
        .from("plan_comparison_features")
        .select("*")
        .eq("subscription_page_id", pageData.id)
        .order("display_order")

      setComparisonFeatures(featuresData || [])

      if (featuresData && featuresData.length > 0) {
        const { data: valuesData } = await supabase
          .from("plan_comparison_values")
          .select("*")
          .in(
            "feature_id",
            featuresData.map((f) => f.id),
          )

        setComparisonValues(valuesData || [])
      }
    } catch (error) {
      console.error("Error fetching page data:", error)
      notFound()
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => (prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]))
  }

  const getCardIcon = (iconName: string) => {
    switch (iconName) {
      case "users":
        return <Users className="h-5 w-5" />
      case "clock":
        return <Clock className="h-5 w-5" />
      case "star":
        return <Star className="h-5 w-5" />
      case "check":
        return <CheckCircle className="h-5 w-5" />
      case "calendar":
        return <Calendar className="h-5 w-5" />
      case "play":
        return <PlayCircle className="h-5 w-5" />
      case "book":
        return <BookOpen className="h-5 w-5" />
      case "trending":
        return <TrendingUp className="h-5 w-5" />
      default:
        return <div className="text-lg">{iconName}</div>
    }
  }

  // Determine back link based on where user came from
  const getBackLink = () => {
    if (fromUpdates) return "/updates"
    if (fromLogin) return "/user/plans" // User subscription page
    if (fromMain) return "/" // Home page
    if (fromHome) return "/" // Home page
    if (fromPlans) return "/plans" // Public plans page
    if (fromUserPlans) return "/user/plans" // User plans page
    return "/plans" // Default to public plans
  }

  const getBackText = () => {
    if (fromUpdates) return "Back to Updates"
    if (fromLogin) return "Back to My Plans"
    if (fromMain) return "Back to Home"
    if (fromHome) return "Back to Home"
    if (fromPlans) return "Back to Plans"
    if (fromUserPlans) return "Back to My Plans"
    return "Back to Plans"
  }

  const getBackIcon = () => {
    if (fromUpdates) return <FileText className="mr-2 h-4 w-4" />
    if (fromLogin) return <Users className="mr-2 h-4 w-4" />
    if (fromMain) return <Home className="mr-2 h-4 w-4" />
    if (fromHome) return <Home className="mr-2 h-4 w-4" />
    if (fromPlans) return <ArrowLeft className="mr-2 h-4 w-4" />
    if (fromUserPlans) return <Users className="mr-2 h-4 w-4" />
    return <ArrowLeft className="mr-2 h-4 w-4" />
  }

  const planIncludesFeature = (featureId: string, subscriptionId: string) => {
    const value = comparisonValues.find(
      (v) => v.feature_id === featureId && String(v.subscription_plan_id) === subscriptionId,
    )
    return value
  }

  const handleSubscribeClick = (planId: string) => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("userAuthenticated") === "true"

    if (isLoggedIn) {
      // User is logged in, go directly to payment
      router.push(`/user/subscribe?plan=${planId}`)
    } else {
      // User not logged in, show auth modal
      setSelectedPlanId(planId)
      setShowAuthModal(true)
    }
  }

  const handleAuthChoice = (choice: "login" | "register") => {
    if (selectedPlanId) {
      // Store the plan ID they want to subscribe to
      sessionStorage.setItem("pendingSubscriptionPlan", selectedPlanId)

      // Redirect to login or register with return URL
      const returnUrl = `/user/subscribe?plan=${selectedPlanId}`
      if (choice === "login") {
        router.push(`/user/login?redirect=${encodeURIComponent(returnUrl)}`)
      } else {
        router.push(`/user/register?redirect=${encodeURIComponent(returnUrl)}`)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <Logo className="h-8 w-auto" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 pt-32">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-96 w-full mb-8 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-48 w-full mb-6 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!page) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-rose-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-pink-300/10 to-purple-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Logo className="h-8 w-auto" />
          </div>
          <Link href={getBackLink()}>
            <Button
              variant="outline"
              size="sm"
              className="border-purple-300 text-purple-600 hover:bg-purple-50 bg-transparent"
            >
              {getBackIcon()}
              {getBackText()}
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative h-[500px] overflow-hidden">
          <Image
            src={
              page.hero_image_url || `/placeholder.svg?height=500&width=1200&query=${encodeURIComponent(page.title)}`
            }
            alt={page.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 via-pink-900/60 to-rose-900/80" />

          {/* Floating Elements */}
          <div className="absolute top-6 right-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white font-bold flex items-center text-sm">
              <Crown className="mr-2 h-4 w-4" />
              Premium Experience
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white max-w-4xl px-4">
              <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-4 py-2 rounded-full text-sm font-bold mb-6 shadow-lg">
                <Sparkles className="mr-2 h-4 w-4" />
                Transform Your Life
                <Flame className="ml-2 h-4 w-4" />
              </div>

              <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300">
                  {page.title}
                </span>
              </h1>

              <p className="text-xl md:text-2xl opacity-95 font-light mb-8 leading-relaxed">{page.subtitle}</p>

              <div className="flex justify-center items-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-bold text-lg px-8 py-4 h-auto shadow-2xl"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Start Now - Limited Time
                </Button>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Info Cards - FIXED ALIGNMENT */}
          {infoCards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 -mt-10 relative z-10">
              {infoCards.map((card, index) => (
                <Card
                  key={card.id}
                  className="text-center hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:scale-105 group"
                >
                  <CardContent className="pt-6 pb-6 px-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <div className="text-purple-600">{getCardIcon(card.icon)}</div>
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">{card.title}</h3>
                    <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                      {card.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Introduction */}
          <Card className="mb-10 border-0 shadow-xl bg-gradient-to-br from-white to-purple-50/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="inline-flex items-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4 mx-auto">
                <Heart className="mr-2 h-4 w-4" />
                Why Choose This Program?
              </div>
              <CardTitle className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
                {page.introduction_title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed text-gray-700 text-center max-w-3xl mx-auto">
                {page.introduction_content}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Content Sections */}
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                  <BookOpen className="mr-2 h-4 w-4" />
                  What You'll Master
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-6">Your Learning Journey</h2>
              </div>

              {contentSections.map((section, index) => (
                <Collapsible key={section.id}>
                  <CollapsibleTrigger
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center justify-between w-full p-5 bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-transparent hover:border-purple-200 group"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 group-hover:scale-110 transition-transform">
                        {index + 1}
                      </div>
                      <h3 className="font-bold text-base text-left text-gray-900">{section.title}</h3>
                    </div>
                    {openSections.includes(section.id) ? (
                      <ChevronDown className="h-5 w-5 text-purple-600" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-purple-600" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-5 pb-5 bg-white/80 backdrop-blur-sm rounded-b-xl border-x border-b border-purple-100">
                    <p className="text-gray-700 leading-relaxed text-base pt-3">{section.content}</p>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>

            {/* Subscription Plans */}
            <div className="space-y-5">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                  <Crown className="mr-2 h-4 w-4" />
                  Choose Your Plan
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-6">Investment in Yourself</h2>
              </div>

              {linkedPlans.map((linkedPlan, index) => (
                <Card
                  key={linkedPlan.id}
                  className="hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:scale-102 bg-gradient-to-br from-white to-yellow-50/50 backdrop-blur-sm relative overflow-hidden group"
                >
                  {/* Popular Badge */}
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 z-10">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-2 py-1 text-xs font-bold shadow-md">
                        <Star className="mr-1 h-3 w-3" />
                        POPULAR
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                          {linkedPlan.subscriptions.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600">
                          {linkedPlan.subscriptions.description}
                        </CardDescription>
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                          ₹{linkedPlan.subscriptions.price}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {linkedPlan.subscriptions.duration_days} days
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {linkedPlan.subscriptions.features && linkedPlan.subscriptions.features.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {linkedPlan.subscriptions.features.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="h-2.5 w-2.5 text-white" />
                            </div>
                            <span className="text-gray-700 text-sm">{feature}</span>
                          </div>
                        ))}
                        {linkedPlan.subscriptions.features.length > 3 && (
                          <div className="text-xs text-gray-500 ml-6">
                            +{linkedPlan.subscriptions.features.length - 3} more features
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={() => handleSubscribeClick(linkedPlan.subscriptions.id)}
                      className="w-full h-10 text-sm font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Choose Plan
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {comparisonFeatures.length > 0 && linkedPlans.length > 0 && (
            <div className="mt-16 mb-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Compare Plans
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">Find Your Perfect Match</h2>
                <p className="text-gray-600">Compare features across all plans to make the best choice</p>
              </div>

              <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-purple-600 to-pink-600">
                          <th className="text-left p-4 text-white font-bold text-sm sticky left-0 bg-gradient-to-r from-purple-600 to-pink-600 z-10">
                            Features
                          </th>
                          {linkedPlans.map((plan) => (
                            <th key={plan.id} className="text-center p-4 text-white font-bold text-sm min-w-[150px]">
                              <div className="flex flex-col items-center">
                                <span className="mb-1">{plan.subscriptions.name}</span>
                                <span className="text-xs font-normal opacity-90">₹{plan.subscriptions.price}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonFeatures.map((feature, index) => (
                          <tr
                            key={feature.id}
                            className={`border-b border-gray-200 hover:bg-purple-50/50 transition-colors ${
                              index % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                            }`}
                          >
                            <td className="p-4 font-medium text-gray-900 text-sm sticky left-0 bg-inherit z-10">
                              <div>
                                <div className="font-semibold">{feature.feature_name}</div>
                                {feature.feature_description && (
                                  <div className="text-xs text-gray-500 mt-1">{feature.feature_description}</div>
                                )}
                              </div>
                            </td>
                            {linkedPlans.map((plan) => {
                              const value = planIncludesFeature(feature.id, plan.subscriptions.id)
                              return (
                                <td key={plan.id} className="p-4 text-center">
                                  {value?.custom_value ? (
                                    <span className="text-sm font-semibold text-purple-600">{value.custom_value}</span>
                                  ) : value?.is_included ? (
                                    <div className="flex justify-center">
                                      <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="h-4 w-4 text-white" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex justify-center">
                                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-gray-400 text-lg">×</span>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* CTA Section */}
              <div className="text-center mt-8">
                <p className="text-gray-600 mb-4">Ready to start your transformation?</p>
                <Button
                  size="lg"
                  onClick={() => {
                    const plansSection = document.querySelector(".space-y-5")
                    plansSection?.scrollIntoView({ behavior: "smooth", block: "center" })
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 h-auto shadow-lg"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Choose Your Plan Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authentication Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Welcome to Your Journey</DialogTitle>
            <DialogDescription className="text-center pt-2">
              To subscribe to this plan, please choose an option below
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
            <Button
              onClick={() => handleAuthChoice("register")}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
            >
              <Users className="mr-2 h-5 w-5" />
              Join Your Journey
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">Already have an account?</span>
              </div>
            </div>

            <Button
              onClick={() => handleAuthChoice("login")}
              variant="outline"
              className="w-full h-14 text-lg font-bold border-2 border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              <User className="mr-2 h-5 w-5" />
              Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
