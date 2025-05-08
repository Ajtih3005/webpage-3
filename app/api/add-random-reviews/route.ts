import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import fs from "fs"
import path from "path"

export async function GET(request: Request) {
  try {
    // Check for admin authentication
    const adminPassword = request.headers.get("x-admin-password")
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseServerClient()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "db", "add_random_reviews.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL query
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlQuery })

    if (error) {
      console.error("Error adding random reviews:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to add random reviews",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Successfully added 43 random reviews",
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error occurred",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
