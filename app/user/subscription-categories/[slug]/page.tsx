import { notFound } from "next/navigation"
import SubscriptionCategory from "@/components/SubscriptionCategory"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface Params {
  slug: string
}

interface Props {
  params: Params
}

async function fetchCategoryData(slug: string) {
  const supabase = getSupabaseBrowserClient()
  const { data: subscription_categories, error } = await supabase
    .from("subscription_categories")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error) {
    console.error("Error fetching subscription category:", error)
    return notFound()
  }

  if (!subscription_categories) {
    return notFound()
  }

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("category_id", subscription_categories.id)

  if (subscriptionsError) {
    console.error("Error fetching subscriptions:", subscriptionsError)
    return notFound()
  }

  return {
    ...subscription_categories,
    subscriptions,
  }
}

export default async function SubscriptionCategoryPage({ params }: Props) {
  const { slug } = params
  const categoryData = await fetchCategoryData(slug)

  if (!categoryData) {
    return notFound()
  }

  return <SubscriptionCategory category={categoryData} />
}
