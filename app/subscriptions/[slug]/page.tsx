"use client"

import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { InfoCard } from "@/components/subscription-page/info-card"
import { ExpandableSection } from "@/components/subscription-page/expandable-section"
import { SubscriptionCard } from "@/components/subscription-page/subscription-card"

interface PageProps {
  params: {
    slug: string
  }
}

async function getSubscriptionPage(slug: string) {
  try {
    // Get page data
    const { data: page, error: pageError } = await db
      .from("subscription_pages")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single()

    if (pageError || !page) return null

    // Get info cards
    const { data: cards } = await db
      .from("subscription_page_cards")
      .select("*")
      .eq("page_id", page.id)
      .order("display_order")

    // Get sections
    const { data: sections } = await db
      .from("subscription_page_sections")
      .select("*")
      .eq("page_id", page.id)
      .order("display_order")

    // Get subscription plans
    const { data: planRelations } = await db
      .from("subscription_page_plans")
      .select(`
        *,
        subscriptions (*)
      `)
      .eq("page_id", page.id)
      .order("display_order")

    const subscriptions = planRelations?.map((rel) => rel.subscriptions) || []

    return {
      page,
      cards: cards || [],
      sections: sections || [],
      subscriptions,
    }
  } catch (error) {
    console.error("Error fetching subscription page:", error)
    return null
  }
}

export default async function SubscriptionPage({ params }: PageProps) {
  const data = await getSubscriptionPage(params.slug)

  if (!data) {
    notFound()
  }

  const { page, cards, sections, subscriptions } = data

  const handleSelectPlan = (subscriptionId: string) => {
    // Redirect to subscription purchase page
    window.location.href = `/user/subscribe?plan=${subscriptionId}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-amber-900 mb-4">{page.title}</h1>
          {page.subtitle && <p className="text-2xl text-amber-700 mb-8">{page.subtitle}</p>}
        </div>

        {/* Info Cards Grid */}
        {cards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {cards.map((card) => (
              <InfoCard key={card.id} icon={card.icon} title={card.title} value={card.value} />
            ))}
          </div>
        )}

        {/* Introduction Section */}
        {page.introduction_content && (
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-amber-900 mb-6 text-center">{page.introduction_title}</h2>
            <div className="bg-white rounded-lg p-8 shadow-sm border border-amber-100">
              <p className="text-gray-700 leading-relaxed text-lg">{page.introduction_content}</p>
            </div>
          </div>
        )}

        {/* Expandable Sections */}
        {sections.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-4 mb-12">
            {sections.map((section) => (
              <ExpandableSection key={section.id} title={section.title} content={section.content} />
            ))}
          </div>
        )}

        {/* Subscription Plans */}
        {subscriptions.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-amber-900 mb-8 text-center">Choose Your Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {subscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  id={subscription.id}
                  name={subscription.name}
                  price={subscription.price}
                  duration_days={subscription.duration_days}
                  features={subscription.features || []}
                  onSelect={handleSelectPlan}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
