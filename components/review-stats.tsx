"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function ReviewStats() {
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    featured: 0,
    averageRating: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = getSupabaseBrowserClient()

        // Get total count
        const { count: total } = await supabase.from("reviews").select("*", { count: "exact", head: true })

        // Get published count
        const { count: published } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("is_published", true)

        // Get featured count
        const { count: featured } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("is_featured", true)
          .eq("is_published", true)

        // Get average rating
        const { data: ratingData } = await supabase.from("reviews").select("rating").eq("is_published", true)

        const averageRating =
          ratingData && ratingData.length > 0
            ? ratingData.reduce((sum, item) => sum + item.rating, 0) / ratingData.length
            : 0

        setStats({
          total: total || 0,
          published: published || 0,
          featured: featured || 0,
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        })
      } catch (error) {
        console.error("Error fetching review stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="h-8 w-8 rounded-full border-2 border-green-200 border-t-green-600 animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-green-700">Total Reviews</p>
              <p className="text-2xl font-bold text-green-800">{stats.total}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-sm text-blue-700">Published</p>
              <p className="text-2xl font-bold text-blue-800">{stats.published}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg text-center">
              <p className="text-sm text-amber-700">Featured</p>
              <p className="text-2xl font-bold text-amber-800">{stats.featured}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-sm text-purple-700">Avg. Rating</p>
              <p className="text-2xl font-bold text-purple-800">{stats.averageRating}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
