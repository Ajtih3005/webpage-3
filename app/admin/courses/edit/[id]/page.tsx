"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn, isValidYoutubeUrl } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function EditCourse({ params }: { params: { id: string } }) {
  const router = useRouter()
  const courseId = Number.parseInt(params.id)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [youtubeLink, setYoutubeLink] = useState("")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [isPredefinedBatch, setIsPredefinedBatch] = useState(true)
  const [batchNumber, setBatchNumber] = useState("")
  const [customBatchTime, setCustomBatchTime] = useState("")
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [language, setLanguage] = useState("English")
  const [subscriptions, setSubscriptions] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchCourse()
    fetchSubscriptions()
  }, [courseId])

  async function fetchCourse() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("courses").select("*").eq("id", courseId).single()

      if (error) throw error

      if (data) {
        setTitle(data.title)
        setDescription(data.description || "")
        setYoutubeLink(data.youtube_link)

        // Properly convert the date string to a Date object
        if (data.scheduled_date) {
          console.log("Fetched date from DB:", data.scheduled_date)
          // Create a new Date object from the YYYY-MM-DD string
          // Note: When creating a date from a string like "2023-04-08",
          // it's interpreted as UTC, so we need to handle timezone conversion
          const [year, month, day] = data.scheduled_date.split("-").map(Number)
          const dateObj = new Date(year, month - 1, day) // month is 0-indexed in JS Date
          console.log("Converted to Date object:", dateObj)
          setDate(dateObj)
        } else {
          setDate(undefined)
        }

        setIsPredefinedBatch(data.is_predefined_batch)
        setBatchNumber(data.batch_number || "")
        setCustomBatchTime(data.custom_batch_time || "")
        setSubscriptionId(data.subscription_id ? data.subscription_id.toString() : null)
        setLanguage(data.language || "English")
      }
    } catch (error) {
      console.error("Error fetching course:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSubscriptions() {
    try {
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("subscriptions").select("id, name")

      if (error) throw error

      setSubscriptions(data || [])
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) newErrors.title = "Title is required"
    if (!youtubeLink.trim()) {
      newErrors.youtubeLink = "YouTube link is required"
    } else if (!isValidYoutubeUrl(youtubeLink)) {
      newErrors.youtubeLink = "Please enter a valid YouTube URL"
    }
    if (!date) newErrors.date = "Date is required"
    if (!language) newErrors.language = "Please select a language"

    if (isPredefinedBatch) {
      if (!batchNumber) newErrors.batchNumber = "Please select a batch"
    } else {
      if (!customBatchTime.trim()) newErrors.customBatchTime = "Custom batch time is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setSaving(true)
      const supabase = getSupabaseBrowserClient()

      // Make sure we have a valid date, defaulting to today if none is selected
      if (!date) {
        console.error("No date selected, using current date")
        setDate(new Date())
      }

      // Format the date as YYYY-MM-DD, ensuring we're using the date in the correct timezone
      const formattedDate = date
        ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0]

      console.log("Updating course with date:", formattedDate, "Original date object:", date)

      const { error } = await supabase
        .from("courses")
        .update({
          title,
          description,
          youtube_link: youtubeLink,
          scheduled_date: formattedDate,
          is_predefined_batch: isPredefinedBatch,
          batch_number: isPredefinedBatch ? batchNumber : null,
          custom_batch_time: !isPredefinedBatch ? customBatchTime : null,
          subscription_id: subscriptionId ? Number.parseInt(subscriptionId) : null,
          language,
        })
        .eq("id", courseId)

      if (error) {
        console.error("Error updating course:", error)
        throw error
      }

      console.log("Course updated successfully with date:", formattedDate)
      router.push("/admin/courses")
    } catch (error) {
      console.error("Error updating course:", error)
      alert("Error updating course. Please check the console for details.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading course data...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Course</h1>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>Update the course information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter course title"
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              {/* Course Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter course description"
                  rows={3}
                />
              </div>

              {/* YouTube Link */}
              <div className="space-y-2">
                <Label htmlFor="youtubeLink">YouTube Video Link</Label>
                <Input
                  id="youtubeLink"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {errors.youtubeLink && <p className="text-sm text-red-500">{errors.youtubeLink}</p>}
              </div>

              {/* Language Selection */}
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Kannada">Kannada</SelectItem>
                  </SelectContent>
                </Select>
                {errors.language && <p className="text-sm text-red-500">{errors.language}</p>}
              </div>

              {/* Scheduled Date */}
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => {
                        if (newDate) {
                          console.log("Date selected:", newDate, "ISO string:", newDate.toISOString())
                          // Create a new Date object to ensure we're not dealing with references
                          const selectedDate = new Date(newDate)
                          setDate(selectedDate)
                        } else {
                          console.log("Date selection cleared")
                          setDate(undefined)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
              </div>

              {/* Batch Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="predefined-batch" checked={isPredefinedBatch} onCheckedChange={setIsPredefinedBatch} />
                  <Label htmlFor="predefined-batch">Use predefined batch times</Label>
                </div>

                {isPredefinedBatch ? (
                  <div className="space-y-2">
                    <Label htmlFor="batch-number">Select Batch</Label>
                    <Select value={batchNumber} onValueChange={setBatchNumber}>
                      <SelectTrigger id="batch-number">
                        <SelectValue placeholder="Select a batch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Morning Batch 1 (5:30 to 6:30)</SelectItem>
                        <SelectItem value="2">Morning Batch 2 (6:40 to 7:40)</SelectItem>
                        <SelectItem value="3">Morning Batch 3 (7:50 to 8:50)</SelectItem>
                        <SelectItem value="4">Evening Batch 4 (5:30 to 6:30)</SelectItem>
                        <SelectItem value="5">Evening Batch 5 (6:40 to 7:40)</SelectItem>
                        <SelectItem value="6">Evening Batch 6 (7:50 to 8:50)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.batchNumber && <p className="text-sm text-red-500">{errors.batchNumber}</p>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="custom-batch">Custom Batch Time</Label>
                    <Input
                      id="custom-batch"
                      value={customBatchTime}
                      onChange={(e) => setCustomBatchTime(e.target.value)}
                      placeholder="e.g., 9:00 AM to 10:00 AM"
                    />
                    {errors.customBatchTime && <p className="text-sm text-red-500">{errors.customBatchTime}</p>}
                  </div>
                )}
              </div>

              {/* Subscription Selection */}
              <div className="space-y-2">
                <Label htmlFor="subscription">Subscription (Optional)</Label>
                <Select value={subscriptionId || ""} onValueChange={setSubscriptionId}>
                  <SelectTrigger id="subscription">
                    <SelectValue placeholder="No subscription required" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No subscription required</SelectItem>
                    {subscriptions.map((subscription) => (
                      <SelectItem key={subscription.id} value={subscription.id.toString()}>
                        {subscription.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/courses")}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  )
}
