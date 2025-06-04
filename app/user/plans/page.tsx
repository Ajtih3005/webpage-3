"use client"

import { useState, useEffect } from "react"
import { UserLayout } from "@/components/user-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { AlertCircle, ArrowRight, Calendar, Users, Star } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

interface SubscriptionPage {
  id: string
  slug: string
  title: string
  subtitle: string
  hero_image_url?: string
  introduction_title?: string
  introduction_content?: string
  status: string
  created_at: string
  updated_at: string
}

interface SubscriptionDetailCardProps {
  page: SubscriptionPage
  planCount: number
  startingPrice: number
}

function SubscriptionDetailCard({ page, planCount, startingPrice }: SubscriptionDetailCardProps) {
  const router = useRouter()

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
      <div className="relative h-48">
        <Image
          src={page.hero_image_url || "/images/default-program.jpg"}
          alt={page.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-xl font-bold mb-1">{page.title}</h3>
          <p className="text-sm opacity-90">{page.subtitle}</p>
        </div>
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {planCount} Plans
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        <p className="text-gray-600 mb-4 line-clamp-3">
          {page.introduction_content ||
            "Discover our comprehensive program designed to transform your wellness journey."}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Star className="h-4 w-4 mr-1 text-yellow-500" />
            <span>Starting from ₹{startingPrice.toLocaleString()}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-1" />
            <span>{planCount} options</span>
          </div>
        </div>

        <Button
          onClick={() => router.push(`/user/subscription-categories/${page.slug}`)}
          className="w-full bg-green-600 hover:bg-green-700 group-hover:bg-green-700"
        >
          Explore Programs
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  )
}

export default function PlansOverviewPage() {
  const [detailPages, setDetailPages] = useState<SubscriptionPage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planCounts, setPlanCounts] = useState<Record<string, { count: number; startingPrice: number }>>({})
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem("userId")

    if (!userId) {
      router.push("/user/login")
      return
    }

    async function fetchDetailPages() {
      try {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Fetch published subscription detail pages
        const { data: pages, error: pagesError } = await supabase
          .from("subscription_pages")
          .select("*")
          .eq("status", "published")
          .order("created_at")

        if (pagesError) {
          console.error("Error fetching subscription pages:", pagesError)
          throw new Error(pagesError.message)
        }

        if (!pages || pages.length === 0) {
          // If no subscription pages exist, create some default ones
          setError("No subscription categories available yet. Please check back later.")
          setDetailPages([])
          return
        }

        // For each page, get the count and starting price of linked subscription plans
        const planCountsData: Record<string, { count: number; startingPrice: number }> = {}

        for (const page of pages) {
          const { data: linkedPlans, error: plansError } = await supabase
            .from("subscription_page_plans")
            .select(`
              subscription_id,
              subscriptions!inner (
                id,
                price,
                name
              )
            `)
            .eq("page_id", page.id)

          if (!plansError && linkedPlans && linkedPlans.length > 0) {
            const prices = linkedPlans.map((lp) => lp.subscriptions.price)
            planCountsData[page.id] = {
              count: linkedPlans.length,
              startingPrice: Math.min(...prices),
            }
          } else {
            // If no linked plans, check if there are any general subscription plans
            const { data: allPlans } = await supabase
              .from("subscriptions")
              .select("price")
              .gt("price", 0)
              .order("price", { ascending: true })

            planCountsData[page.id] = {
              count: allPlans?.length || 0,
              startingPrice: allPlans?.[0]?.price || 0,
            }
          }
        }

        setDetailPages(pages)
        setPlanCounts(planCountsData)
      } catch (err) {
        console.error("Failed to load subscription categories:", err)
        setError("Failed to load subscription categories. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchDetailPages()
  }, [router])

  if (loading) {
    return (
      <UserLayout>
        <div className="container mx-auto py-6">
          <h1 className="text-3xl font-bold mb-6">Choose Your Program</h1>
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Choose Your Wellness Journey</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our comprehensive programs designed to transform your mind, body, and spirit. Each program offers
            multiple subscription options to fit your lifestyle and goals.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {detailPages.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Programs Available</h3>
              <p className="text-gray-600 mb-6">
                We're currently setting up our subscription programs. Please check back soon!
              </p>
              <Button onClick={() => router.push("/user/dashboard")} variant="outline">
                Return to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {detailPages.map((page) => (
              <SubscriptionDetailCard
                key={page.id}
                page={page}
                planCount={planCounts[page.id]?.count || 0}
                startingPrice={planCounts[page.id]?.startingPrice || 0}
              />
            ))}
          </div>
        )}

        {detailPages.length > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-green-50 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold mb-2">Need Help Choosing?</h3>
              <p className="text-gray-600 mb-4">
                Our team is here to help you find the perfect program for your wellness goals.
              </p>
              <Button
                onClick={() => router.push("/user/contact")}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
              >
                Contact Our Team
              </Button>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  )
}
