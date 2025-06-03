"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Save, Eye, ArrowLeft } from "lucide-react"

interface InfoCardData {
  id: string
  icon: string
  title: string
  value: string
}

interface SectionData {
  id: string
  title: string
  content: string
}

interface Subscription {
  id: number
  name: string
  price: number
  duration_days: number
  features: string[]
}

export default function CreateSubscriptionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [savedPageSlug, setSavedPageSlug] = useState<string>("")

  // Form data
  const [pageData, setPageData] = useState({
    slug: "",
    title: "",
    subtitle: "",
    introduction_title: "Introduction",
    introduction_content: "",
    status: "published",
  })

  const [infoCards, setInfoCards] = useState<InfoCardData[]>([])
  const [sections, setSections] = useState<SectionData[]>([])
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<number[]>([])

  const iconOptions = [
    { value: "calendar", label: "📅 Calendar" },
    { value: "clock", label: "🕐 Clock" },
    { value: "dollar", label: "💰 Price" },
    { value: "globe", label: "🌍 Language" },
    { value: "gift", label: "🎁 Gift" },
    { value: "book", label: "📚 Book" },
    { value: "users", label: "👥 Users" },
    { value: "star", label: "⭐ Star" },
    { value: "award", label: "🏆 Award" },
    { value: "target", label: "🎯 Target" },
  ]

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/subscriptions")
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    }
  }

  const addInfoCard = () => {
    const newCard: InfoCardData = {
      id: Date.now().toString(),
      icon: "calendar",
      title: "",
      value: "",
    }
    setInfoCards([...infoCards, newCard])
  }

  const updateInfoCard = (id: string, field: keyof InfoCardData, value: string) => {
    setInfoCards(infoCards.map((card) => (card.id === id ? { ...card, [field]: value } : card)))
  }

  const removeInfoCard = (id: string) => {
    setInfoCards(infoCards.filter((card) => card.id !== id))
  }

  const addSection = () => {
    const newSection: SectionData = {
      id: Date.now().toString(),
      title: "",
      content: "",
    }
    setSections([...sections, newSection])
  }

  const updateSection = (id: string, field: keyof SectionData, value: string) => {
    setSections(sections.map((section) => (section.id === id ? { ...section, [field]: value } : section)))
  }

  const removeSection = (id: string) => {
    setSections(sections.filter((section) => section.id !== id))
  }

  const toggleSubscription = (subscriptionId: number) => {
    setSelectedSubscriptions((prev) =>
      prev.includes(subscriptionId) ? prev.filter((id) => id !== subscriptionId) : [...prev, subscriptionId],
    )
  }

  const generateSlugFromTitle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setPageData({ ...pageData, title })
    if (!pageData.slug) {
      setPageData((prev) => ({ ...prev, title, slug: generateSlugFromTitle(title) }))
    }
  }

  const savePage = async () => {
    if (!pageData.title || !pageData.slug) {
      alert("Please fill in the page title and slug")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/subscription-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pageData,
          info_cards: infoCards.filter((card) => card.title && card.value),
          sections: sections.filter((section) => section.title && section.content),
          subscription_ids: selectedSubscriptions,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setSavedPageSlug(pageData.slug)
        alert("Page saved successfully!")
      } else {
        const error = await response.json()
        alert(`Error saving page: ${error.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error saving page:", error)
      alert("Error saving page. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const viewPage = () => {
    if (savedPageSlug || pageData.slug) {
      window.open(`/subscriptions/${savedPageSlug || pageData.slug}`, "_blank")
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.push("/admin/subscription-pages")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pages
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Create Subscription Page</h1>
          </div>
          <div className="flex items-center space-x-2">
            {(savedPageSlug || pageData.slug) && (
              <Button variant="outline" onClick={viewPage}>
                <Eye className="h-4 w-4 mr-2" />
                View Page
              </Button>
            )}
            <Button onClick={savePage} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save & Publish"}
            </Button>
          </div>
        </div>

        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Page Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Page Title *</Label>
                <Input
                  id="title"
                  value={pageData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="30 Day Yoga Sadhana"
                />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={pageData.slug}
                  onChange={(e) => setPageData({ ...pageData, slug: e.target.value })}
                  placeholder="30-day-yoga-sadhana"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Page will be available at: /subscriptions/{pageData.slug || "your-slug"}
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={pageData.subtitle}
                onChange={(e) => setPageData({ ...pageData, subtitle: e.target.value })}
                placeholder="With Expert Instructor"
              />
            </div>
          </CardContent>
        </Card>

        {/* Information Cards */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Information Cards</CardTitle>
              <Button onClick={addInfoCard} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Info Card
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {infoCards.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No information cards added yet. Click "Add Info Card" to get started.
              </p>
            ) : (
              infoCards.map((card, index) => (
                <div key={card.id} className="flex items-center space-x-4 p-4 border rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-500 w-8">#{index + 1}</div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select value={card.icon} onValueChange={(value) => updateInfoCard(card.id, "icon", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={card.title}
                      onChange={(e) => updateInfoCard(card.id, "title", e.target.value)}
                      placeholder="Start Date"
                    />
                    <Input
                      value={card.value}
                      onChange={(e) => updateInfoCard(card.id, "value", e.target.value)}
                      placeholder="Jun 30, 2025"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => removeInfoCard(card.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Introduction Section */}
        <Card>
          <CardHeader>
            <CardTitle>Introduction Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="intro-title">Section Title</Label>
              <Input
                id="intro-title"
                value={pageData.introduction_title}
                onChange={(e) => setPageData({ ...pageData, introduction_title: e.target.value })}
                placeholder="Introduction"
              />
            </div>
            <div>
              <Label htmlFor="intro-content">Content</Label>
              <Textarea
                id="intro-content"
                value={pageData.introduction_content}
                onChange={(e) => setPageData({ ...pageData, introduction_content: e.target.value })}
                rows={6}
                placeholder="Write your introduction content here. Explain what this subscription offers, its benefits, and why users should choose it..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Expandable Sections */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Expandable Content Sections</CardTitle>
              <Button onClick={addSection} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No sections added yet. Click "Add Section" to create expandable content areas.
              </p>
            ) : (
              sections.map((section, index) => (
                <div key={section.id} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">Section #{index + 1}</div>
                    <Button variant="outline" size="sm" onClick={() => removeSection(section.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={section.title}
                    onChange={(e) => updateSection(section.id, "title", e.target.value)}
                    placeholder="Section Title (e.g., What's Included, Daily Schedule, Benefits)"
                  />
                  <Textarea
                    value={section.content}
                    onChange={(e) => updateSection(section.id, "content", e.target.value)}
                    placeholder="Section content... This will be collapsible on the frontend."
                    rows={4}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Subscription Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Related Subscription Plans</CardTitle>
            <p className="text-sm text-gray-600">Select which subscription plans to display on this page</p>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No subscriptions available. Create subscriptions first.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedSubscriptions.includes(subscription.id)
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                    onClick={() => toggleSubscription(subscription.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{subscription.name}</h3>
                      <div
                        className={`w-4 h-4 rounded border-2 ${
                          selectedSubscriptions.includes(subscription.id)
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedSubscriptions.includes(subscription.id) && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-sm"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-green-600">₹{subscription.price}</p>
                    <p className="text-sm text-gray-600">{subscription.duration_days} days</p>
                    {subscription.features && subscription.features.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">{subscription.features.length} features included</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {selectedSubscriptions.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ {selectedSubscriptions.length} subscription plan(s) selected
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-center pb-8">
          <Button onClick={savePage} disabled={loading} size="lg" className="px-8">
            <Save className="h-5 w-5 mr-2" />
            {loading ? "Saving Page..." : "Save & Publish Page"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  )
}
