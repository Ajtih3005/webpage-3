import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // Create subscription_pages table
    const createPagesTable = `
      CREATE TABLE IF NOT EXISTS subscription_pages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        hero_image_url TEXT,
        introduction_title VARCHAR(255) DEFAULT 'Introduction',
        introduction_content TEXT,
        status VARCHAR(20) DEFAULT 'draft',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create subscription_page_cards table
    const createCardsTable = `
      CREATE TABLE IF NOT EXISTS subscription_page_cards (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        page_id UUID REFERENCES subscription_pages(id) ON DELETE CASCADE,
        card_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        value VARCHAR(255) NOT NULL,
        icon VARCHAR(50) NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create subscription_page_sections table
    const createSectionsTable = `
      CREATE TABLE IF NOT EXISTS subscription_page_sections (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        page_id UUID REFERENCES subscription_pages(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create subscription_page_plans table
    const createPlansTable = `
      CREATE TABLE IF NOT EXISTS subscription_page_plans (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        page_id UUID REFERENCES subscription_pages(id) ON DELETE CASCADE,
        subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Execute all table creation queries
    await db.rpc("execute_sql", { query_text: createPagesTable })
    await db.rpc("execute_sql", { query_text: createCardsTable })
    await db.rpc("execute_sql", { query_text: createSectionsTable })
    await db.rpc("execute_sql", { query_text: createPlansTable })

    return NextResponse.json({
      success: true,
      message: "Subscription pages tables created successfully",
    })
  } catch (error) {
    console.error("Error creating subscription pages tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create tables",
      },
      { status: 500 },
    )
  }
}
