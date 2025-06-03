"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Eye, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

interface SubscriptionPage {
  id: string
  slug: string
  title: string
  subtitle: string
  status: string
  created_at: string
}

export default function SubscriptionPagesManagement() {
  const [pages, setPages] = useState<SubscriptionPage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const response = await fetch("/api/subscription-pages")
      if (response.ok) {
        const data = await response.json()
        setPages(data.pages || [])
      }
    } catch (error) {
      console.error("Error fetching pages:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Pages</h1>
          <p className="text-gray-600 mt-2">Manage your subscription landing pages</p>
        </div>
        <Link href="/admin/subscription-pages/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Page
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page) => (
          <Card key={page.id}>
            <CardHeader>
              <CardTitle className="text-lg">{page.title}</CardTitle>
              {page.subtitle && <p className="text-sm text-gray-600">{page.subtitle}</p>}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">URL:</span> /subscriptions/{page.slug}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      page.status === "published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {page.status}
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Link href={`/subscriptions/${page.slug}`} target="_blank">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pages.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No subscription pages created yet</p>
          <Link href="/admin/subscription-pages/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Page
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
