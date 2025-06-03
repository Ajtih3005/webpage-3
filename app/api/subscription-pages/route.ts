import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { slug, title, subtitle, heroImage, introTitle, introContent, infoCards, sections, selectedSubscriptions } =
      data

    // Insert main page
    const { data: pageData, error: pageError } = await db
      .from("subscription_pages")
      .insert({
        slug,
        title,
        subtitle,
        hero_image_url: heroImage,
        introduction_title: introTitle,
        introduction_content: introContent,
        status: "published",
      })
      .select()
      .single()

    if (pageError) throw pageError

    const pageId = pageData.id

    // Insert info cards
    if (infoCards.length > 0) {
      const cardsToInsert = infoCards.map((card: any, index: number) => ({
        page_id: pageId,
        card_type: card.icon,
        title: card.title,
        value: card.value,
        icon: card.icon,
        display_order: index,
      }))

      const { error: cardsError } = await db.from("subscription_page_cards").insert(cardsToInsert)

      if (cardsError) throw cardsError
    }

    // Insert sections
    if (sections.length > 0) {
      const sectionsToInsert = sections.map((section: any, index: number) => ({
        page_id: pageId,
        title: section.title,
        content: section.content,
        display_order: index,
      }))

      const { error: sectionsError } = await db.from("subscription_page_sections").insert(sectionsToInsert)

      if (sectionsError) throw sectionsError
    }

    // Insert subscription plans
    if (selectedSubscriptions.length > 0) {
      const plansToInsert = selectedSubscriptions.map((subscriptionId: string, index: number) => ({
        page_id: pageId,
        subscription_id: subscriptionId,
        display_order: index,
      }))

      const { error: plansError } = await db.from("subscription_page_plans").insert(plansToInsert)

      if (plansError) throw plansError
    }

    return NextResponse.json({
      success: true,
      message: "Subscription page created successfully",
      pageId,
    })
  } catch (error) {
    console.error("Error creating subscription page:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create subscription page",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const { data: pages, error } = await db
      .from("subscription_pages")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, pages })
  } catch (error) {
    console.error("Error fetching subscription pages:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch subscription pages",
      },
      { status: 500 },
    )
  }
}
