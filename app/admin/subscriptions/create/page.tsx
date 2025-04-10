"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function CreateSubscription() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [durationDays, setDurationDays] = useState("")
  const [paymentLink, setPaymentLink] = useState("")
  const [isExternalLink, setIsExternalLink] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = "Name is required"

    if (!price.trim()) {
      newErrors.price = "Price is required"
    } else if (isNaN(Number.parseFloat(price)) || Number.parseFloat(price) < 0) {
      newErrors.price = "Price must be a valid positive number"
    }

    if (!durationDays.trim()) {
      newErrors.durationDays = "Duration is required"
    } else if (isNaN(Number.parseInt(durationDays)) || Number.parseInt(durationDays) <= 0) {
      newErrors.durationDays = "Duration must be a valid positive number"
    }

    if (paymentLink.trim() && !paymentLink.startsWith("http")) {
      newErrors.paymentLink = "Payment link must be a valid URL starting with http:// or https://"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from("subscriptions")
        .insert([
          {
            name,
            description: description || null,
            price: Number.parseFloat(price),
            duration_days: Number.parseInt(durationDays),
            payment_link: paymentLink || null,
            is_external_link: isExternalLink,
          },
        ])
        .select()

      if (error) throw error

      router.push("/admin/subscriptions")
    } catch (error) {
      console.error("Error creating subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Create Subscription Plan</h1>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>Create a new subscription plan for your users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter plan name" />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter plan description"
                  rows={3}
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price in rupees"
                />
                {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Days)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="Enter duration in days"
                />
                {errors.durationDays && <p className="text-sm text-red-500">{errors.durationDays}</p>}
              </div>

              {/* Payment Link */}
              <div className="space-y-2">
                <Label htmlFor="payment-link">Payment Link (Optional)</Label>
                <Input
                  id="payment-link"
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                  placeholder="Enter payment link"
                />
                {errors.paymentLink && <p className="text-sm text-red-500">{errors.paymentLink}</p>}
              </div>

              {/* External Link Toggle */}
              <div className="flex items-center space-x-2">
                <Switch id="external-link" checked={isExternalLink} onCheckedChange={setIsExternalLink} />
                <Label htmlFor="external-link">This is an external payment link</Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/subscriptions")}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Subscription"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  )
}
