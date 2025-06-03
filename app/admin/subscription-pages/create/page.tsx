"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InfoCard } from "@/components/subscription-page/info-card"
import { ExpandableSection } from "@/components/subscription-page/expandable-section"
import { SubscriptionCard } from "@/components/subscription-page/subscription-card"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface SubscriptionData {
  id: string
  name: string
  price: number
  duration_days: number
  features: string[]
}

export default function CreateSubscriptionPage() {
  const { toast } = useToast()
  const [pageData, setPageData] = useState({
    slug: "",
    title: "",
    subtitle: "",
    heroImage: "",
    introTitle: "Introduction",
    introContent: "",
  })

  const [infoCards, setInfoCards] = useState<InfoCardData[]>([])
  const [sections, setSections] = useState<SectionData[]>([])
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([])
  const [availableSubscriptions, setAvailableSubscriptions] = useState<SubscriptionData[]>([])

  const [newCard, setNewCard] = useState({
    icon: "calendar",
    title: "",
    value: "",
  })

  const [newSection, setNewSection] = useState({
    title: "",
    content: "",
  })

  const iconOptions = [
    { value: "calendar", label: "Calendar" },
    { value: "clock", label: "Clock" },
    { value: "globe", label: "Globe" },
    { value: "gift", label: "Gift" },
    { value: "dollar", label: "Dollar" },
    { value: "chart", label: "Chart" },
  ]

  // Fetch available subscriptions
  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/subscriptions")
      if (response.ok) {
        const data = await response.json()
        setAvailableSubscriptions(data.subscriptions || [])
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    }
  }

  const addInfoCard = () => {
    if (!newCard.title || !newCard.value) {
      toast({
        title: "Error",
        description: "Please fill in all card fields",
        variant: "destructive",
      })
      return
    }

    const card: InfoCardData = {
      id: Date.now().toString(),
      ...newCard,
    }

    setInfoCards([...infoCards, card])
    setNewCard({ icon: "calendar", title: "", value: "" })
  }

  const removeInfoCard = (id: string) => {
    setInfoCards(infoCards.filter((card) => card.id !== id))
  }

  const addSection = () => {
    if (!newSection.title || !newSection.content) {
      toast({
        title: "Error",
        description: "Please fill in all section fields",
        variant: "destructive",
      })
      return
    }

    const section: SectionData = {
      id: Date.now().toString(),
      ...newSection,
    }

    setSections([...sections, section])
    setNewSection({ title: "", content: "" })
  }

  const removeSection = (id: string) => {
    setSections(sections.filter((section) => section.id !== id))
  }

  const handleSubscriptionToggle = (subscriptionId: string) => {
    setSelectedSubscriptions((prev) =>
      prev.includes(subscriptionId) ? prev.filter((id) => id !== subscriptionId) : [...prev, subscriptionId],
    )
  }

  const savePage = async () => {
    if (!pageData.slug || !pageData.title) {
      toast({
        title: "Error",
        description: "Please fill in page slug and title",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/subscription-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pageData,
          infoCards,
          sections,
          selectedSubscriptions,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subscription page created successfully",
        })
      } else {
        throw new Error("Failed to save page")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save page",
        variant: "destructive",
      })
    }
  }

  const getSelectedSubscriptionData = () => {
    return availableSubscriptions.filter((sub) => selectedSubscriptions.includes(sub.id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create Subscription Page</h1>
          <p className="text-gray-600 mt-2">Build a custom subscription landing page with live preview</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Form Inputs */}
          <div className="space-y-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="slug">Page URL Slug</Label>
                  <Input
                    id="slug"
                    placeholder="yoga-mastery"
                    value={pageData.slug}
                    onChange={(e) => setPageData({ ...pageData, slug: e.target.value })}
                  />
                  <p className="text-sm text-gray-500 mt-1">Will be available at: /subscriptions/{pageData.slug}</p>
                </div>

                <div>
                  <Label htmlFor="title">Page Title</Label>
                  <Input
                    id="title"
                    placeholder="30 Day Yoga Sadhana"
                    value={pageData.title}
                    onChange={(e) => setPageData({ ...pageData, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    placeholder="With Expert Instructor"
                    value={pageData.subtitle}
                    onChange={(e) => setPageData({ ...pageData, subtitle: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Info Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Information Cards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <Select value={newCard.icon} onValueChange={(value) => setNewCard({ ...newCard, icon: value })}>
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
                    placeholder="Title"
                    value={newCard.title}
                    onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                  />

                  <Input
                    placeholder="Value"
                    value={newCard.value}
                    onChange={(e) => setNewCard({ ...newCard, value: e.target.value })}
                  />
                </div>

                <Button onClick={addInfoCard} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Info Card
                </Button>

                <div className="space-y-2">
                  {infoCards.map((card) => (
                    <div key={card.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-sm">
                        {card.title}: {card.value}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => removeInfoCard(card.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Expandable Sections */}
            <Card>
              <CardHeader>
                <CardTitle>Expandable Sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    placeholder="Section Title"
                    value={newSection.title}
                    onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                    className="mb-2"
                  />
                  <Textarea
                    placeholder="Section Content"
                    value={newSection.content}
                    onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button onClick={addSection} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>

                <div className="space-y-2">
                  {sections.map((section) => (
                    <div key={section.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-sm">{section.title}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeSection(section.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle>Introduction Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="introTitle">Section Title</Label>
                  <Input
                    id="introTitle"
                    value={pageData.introTitle}
                    onChange={(e) => setPageData({ ...pageData, introTitle: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="introContent">Content</Label>
                  <Textarea
                    id="introContent"
                    rows={4}
                    value={pageData.introContent}
                    onChange={(e) => setPageData({ ...pageData, introContent: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Subscription Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Related Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {availableSubscriptions.map((subscription) => (
                    <label key={subscription.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedSubscriptions.includes(subscription.id)}
                        onChange={() => handleSubscriptionToggle(subscription.id)}
                      />
                      <span className="text-sm">
                        {subscription.name} - ₹{subscription.price}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button onClick={savePage} className="w-full" size="lg">
              Save & Publish Page
            </Button>
          </div>

          {/* Right Side - Live Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-6 border">
                  {/* Hero Section */}
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-amber-900 mb-2">{pageData.title || "Page Title"}</h1>
                    {pageData.subtitle && <p className="text-xl text-amber-700">{pageData.subtitle}</p>}
                  </div>

                  {/* Info Cards Grid */}
                  {infoCards.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                      {infoCards.map((card) => (
                        <InfoCard key={card.id} icon={card.icon} title={card.title} value={card.value} />
                      ))}
                    </div>
                  )}

                  {/* Introduction */}
                  {pageData.introContent && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-amber-900 mb-4">{pageData.introTitle}</h2>
                      <p className="text-gray-700 leading-relaxed">{pageData.introContent}</p>
                    </div>
                  )}

                  {/* Expandable Sections */}
                  {sections.length > 0 && (
                    <div className="space-y-4 mb-8">
                      {sections.map((section) => (
                        <ExpandableSection key={section.id} title={section.title} content={section.content} />
                      ))}
                    </div>
                  )}

                  {/* Subscription Plans */}
                  {getSelectedSubscriptionData().length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">Choose Your Plan</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {getSelectedSubscriptionData().map((subscription) => (
                          <SubscriptionCard
                            key={subscription.id}
                            id={subscription.id}
                            name={subscription.name}
                            price={subscription.price}
                            duration_days={subscription.duration_days}
                            features={subscription.features}
                            onSelect={(id) => console.log("Selected:", id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
