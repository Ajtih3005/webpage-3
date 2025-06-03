import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data: pages, error } = await supabase
      .from("subscription_pages")
      .select(`
        *,
        info_cards:subscription_page_cards(count),
        sections:subscription_page_sections(count),
        subscriptions:subscription_page_plans(count)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    const formattedPages = pages?.map((page) => ({
      ...page,
      info_cards_count: page.info_cards?.[0]?.count || 0,
      sections_count: page.sections?.[0]?.count || 0,
      subscriptions_count: page.subscriptions?.[0]?.count || 0,
    }))

    return NextResponse.json({ pages: formattedPages })
  } catch (error) {
    console.error("Error fetching subscription pages:", error)
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { info_cards, sections, subscription_ids, ...pageData } = body

    // Insert main page
    const { data: page, error: pageError } = await supabase
      .from("subscription_pages")
      .insert([pageData])
      .select()
      .single()

    if (pageError) throw pageError

    // Insert info cards
    if (info_cards && info_cards.length > 0) {
      const cardsToInsert = info_cards.map((card: any, index: number) => ({
        page_id: page.id,
        card_type: card.icon,
        title: card.title,
        value: card.value,
        icon: card.icon,
        display_order: index,
      }))

      const { error: cardsError } = await supabase.from("subscription_page_cards").insert(cardsToInsert)

      if (cardsError) throw cardsError
    }

    // Insert sections
    if (sections && sections.length > 0) {
      const sectionsToInsert = sections.map((section: any, index: number) => ({
        page_id: page.id,
        title: section.title,
        content: section.content,
        display_order: index,
      }))

      const { error: sectionsError } = await supabase.from("subscription_page_sections").insert(sectionsToInsert)

      if (sectionsError) throw sectionsError
    }

    // Insert subscription relationships
    if (subscription_ids && subscription_ids.length > 0) {
      const plansToInsert = subscription_ids.map((id: number, index: number) => ({
        page_id: page.id,
        subscription_id: id,
        display_order: index,
      }))

      const { error: plansError } = await supabase.from("subscription_page_plans").insert(plansToInsert)

      if (plansError) throw plansError
    }

    return NextResponse.json({ success: true, page })
  } catch (error) {
    console.error("Error creating subscription page:", error)
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 })
  }
}
