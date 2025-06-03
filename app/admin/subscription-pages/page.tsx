"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react"

interface SubscriptionPage {
  id: string
  slug: string
  title: string
  subtitle: string
  status: string
  created_at: string
  info_cards_count: number
  sections_count: number
  subscriptions_count: number
}

export default function SubscriptionPagesManagement() {
  const router = useRouter()
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

  const deletePage = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/subscription-pages/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPages(pages.filter((page) => page.id !== id))
        alert("Page deleted successfully")
      } else {
        alert("Error deleting page")
      }
    } catch (error) {
      console.error("Error deleting page:", error)
      alert("Error deleting page")
    }
  }

  const viewPage = (slug: string) => {
    window.open(`/subscriptions/${slug}`, "_blank")
  }

  const editPage = (id: string) => {
    router.push(`/admin/subscription-pages/edit/${id}`)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading subscription pages...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscription Pages</h1>
            <p className="text-gray-600 mt-2">Manage your subscription landing pages</p>
          </div>
          <Button onClick={() => router.push("/admin/subscription-pages/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Page
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{pages.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {pages.filter((page) => page.status === "published").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {pages.filter((page) => page.status === "draft").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pages List */}
        <Card>
          <CardHeader>
            <CardTitle>All Subscription Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {pages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Plus className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No subscription pages yet</h3>
                <p className="text-gray-600 mb-4">Create your first subscription landing page to get started.</p>
                <Button onClick={() => router.push("/admin/subscription-pages/create")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Page
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{page.title}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            page.status === "published"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {page.status}
                        </span>
                      </div>
                      {page.subtitle && <p className="text-gray-600 mt-1">{page.subtitle}</p>}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>URL: /subscriptions/{page.slug}</span>
                        <span>•</span>
                        <span>{page.info_cards_count} info cards</span>
                        <span>•</span>
                        <span>{page.sections_count} sections</span>
                        <span>•</span>
                        <span>{page.subscriptions_count} plans</span>
                        <span>•</span>
                        <span>Created {new Date(page.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => viewPage(page.slug)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => editPage(page.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePage(page.id, page.title)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
