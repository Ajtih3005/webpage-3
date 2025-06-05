"use client"

import { useState, useEffect } from "react"
import { notFound, useSearchParams } from "next/navigation"
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
  Award,
  Target,
  Flame,
  Calendar,
  PlayCircle,
  BookOpen,
  TrendingUp,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

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

export default function SubscriptionCategoryPage({ params }: { params: { slug: string } }) {
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState<SubscriptionPage | null>(null)
  const [infoCards, setInfoCards] = useState<InfoCard[]>([])
  const [contentSections, setContentSections] = useState<ContentSection[]>([])
  const [linkedPlans, setLinkedPlans] = useState<LinkedPlan[]>([])
  const [openSections, setOpenSections] = useState<string[]>([])

  const searchParams = useSearchParams()
  const fromUpdates = searchParams.get("from") === "updates"

  useEffect(() => {
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
        return <Users className="h-6 w-6" />
      case "clock":
        return <Clock className="h-6 w-6" />
      case "star":
        return <Star className="h-6 w-6" />
      case "check":
        return <CheckCircle className="h-6 w-6" />
      case "calendar":
        return <Calendar className="h-6 w-6" />
      case "play":
        return <PlayCircle className="h-6 w-6" />
      case "book":
        return <BookOpen className="h-6 w-6" />
      case "trending":
        return <TrendingUp className="h-6 w-6" />
      default:
        return <div className="text-2xl">{iconName}</div>
    }
  }

  // Determine back link based on where user came from
  const getBackLink = () => {
    if (fromUpdates) {
      return "/updates"
    }
    return "/user/plans"
  }

  const getBackText = () => {
    if (fromUpdates) {
      return "Back to Updates"
    }
    return "Back to All Programs"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="container mx-auto px-4 py-8">
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

      <div className="relative z-10">
        {/* Navigation */}
        <div className="container mx-auto px-4 py-6">
          <Link href={getBackLink()}>
            <Button
              variant="outline"
              size="lg"
              className="mb-6 bg-white/80 backdrop-blur-sm border-2 border-purple-200 hover:border-purple-400 shadow-lg"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              {getBackText()}
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="relative h-[600px] overflow-hidden">
          <Image
            src={
              page.hero_image_url || `/placeholder.svg?height=600&width=1200&query=${encodeURIComponent(page.title)}`
            }
            alt={page.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 via-pink-900/60 to-rose-900/80" />

          {/* Floating Elements */}
          <div className="absolute top-8 right-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white font-bold flex items-center">
              <Crown className="mr-2 h-5 w-5" />
              Premium Experience
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white max-w-5xl px-4">
              <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-6 py-2 rounded-full text-sm font-bold mb-6 shadow-lg">
                <Sparkles className="mr-2 h-4 w-4" />
                Transform Your Life
                <Flame className="ml-2 h-4 w-4" />
              </div>

              <h1 className="text-5xl md:text-8xl font-black mb-6 leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300">
                  {page.title}
                </span>
              </h1>

              <p className="text-2xl md:text-4xl opacity-95 font-light mb-8 leading-relaxed">{page.subtitle}</p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-bold text-lg px-8 py-4 h-auto shadow-2xl"
                >
                  <Zap className="mr-2 h-6 w-6" />
                  Start Now - Limited Time
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-purple-600 font-bold text-lg px-8 py-4 h-auto"
                >
                  <PlayCircle className="mr-2 h-6 w-6" />
                  Watch Preview
                </Button>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-8 w-8 text-white" />
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Info Cards */}
          {infoCards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 -mt-20 relative z-10">
              {infoCards.map((card, index) => (
                <Card
                  key={card.id}
                  className="text-center hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:scale-105 group"
                >
                  <CardContent className="pt-8 pb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <div className="text-purple-600">{getCardIcon(card.icon)}</div>
                    </div>
                    <h3 className="font-bold text-xl mb-3 text-gray-900">{card.title}</h3>
                    <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                      {card.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Introduction */}
          <Card className="mb-20 border-0 shadow-2xl bg-gradient-to-br from-white to-purple-50/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="inline-flex items-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-bold mb-6 mx-auto">
                <Heart className="mr-2 h-4 w-4" />
                Why Choose This Program?
              </div>
              <CardTitle className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
                {page.introduction_title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl leading-relaxed text-gray-700 text-center max-w-4xl mx-auto">
                {page.introduction_content}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Content Sections */}
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-full text-sm font-bold mb-6">
                  <BookOpen className="mr-2 h-4 w-4" />
                  What You'll Master
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-8">Your Learning Journey</h2>
              </div>

              {contentSections.map((section, index) => (
                <Collapsible key={section.id}>
                  <CollapsibleTrigger
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center justify-between w-full p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-200 group"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 group-hover:scale-110 transition-transform">
                        {index + 1}
                      </div>
                      <h3 className="font-bold text-lg text-left text-gray-900">{section.title}</h3>
                    </div>
                    {openSections.includes(section.id) ? (
                      <ChevronDown className="h-6 w-6 text-purple-600" />
                    ) : (
                      <ChevronRight className="h-6 w-6 text-purple-600" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-6 pb-6 bg-white/80 backdrop-blur-sm rounded-b-2xl border-x-2 border-b-2 border-purple-100">
                    <p className="text-gray-700 leading-relaxed text-lg pt-4">{section.content}</p>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>

            {/* Subscription Plans - COMPACT SIZE */}
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold mb-6">
                  <Crown className="mr-2 h-4 w-4" />
                  Choose Your Plan
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-8">Investment in Yourself</h2>
              </div>

              {linkedPlans.map((linkedPlan, index) => (
                <Card
                  key={linkedPlan.id}
                  className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:scale-102 bg-gradient-to-br from-white to-yellow-50/50 backdrop-blur-sm relative overflow-hidden group"
                >
                  {/* Popular Badge */}
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-3 py-1 text-xs font-bold shadow-lg">
                        <Star className="mr-1 h-3 w-3" />
                        POPULAR
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                          {linkedPlan.subscriptions.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600">
                          {linkedPlan.subscriptions.description}
                        </CardDescription>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
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
                              <CheckCircle className="h-3 w-3 text-white" />
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

                    <Link href={`/user/subscribe?plan=${linkedPlan.subscriptions.id}`}>
                      <Button className="w-full h-12 text-base font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                        <Zap className="mr-2 h-4 w-4" />
                        Choose Plan
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center mt-24">
            <Card className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white border-0 shadow-2xl overflow-hidden relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 -translate-y-20"></div>
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-24 translate-y-24"></div>
                <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white rounded-full"></div>
              </div>

              <CardContent className="py-16 relative z-10">
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 text-sm font-bold mb-8">
                  <Award className="mr-2 h-4 w-4" />
                  Limited Time Offer
                </div>

                <h2 className="text-5xl md:text-6xl font-black mb-6">Ready to Begin?</h2>
                <p className="text-2xl md:text-3xl mb-10 opacity-95 max-w-4xl mx-auto font-light">
                  Join thousands who have already started their transformation.
                  <span className="font-bold"> Your new life awaits!</span>
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Link href="/user/contact">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="text-purple-600 bg-white hover:bg-gray-50 text-xl font-bold px-10 py-6 h-auto shadow-xl"
                    >
                      <Heart className="mr-3 h-6 w-6" />
                      Get Personal Consultation
                    </Button>
                  </Link>
                  <Link href="/user/register">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-3 border-white text-white hover:bg-white hover:text-purple-600 text-xl font-bold px-10 py-6 h-auto"
                    >
                      <Target className="mr-3 h-6 w-6" />
                      Start Free Trial
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
