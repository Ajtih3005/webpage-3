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
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn, isValidYoutubeUrl } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CreateCourse() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [youtubeLink, setYoutubeLink] = useState("")
  const [isPredefinedBatch, setIsPredefinedBatch] = useState(true)
  const [selectedBatches, setSelectedBatches] = useState<string[]>([])
  const [customBatches, setCustomBatches] = useState<{ id: string; time: string; subscriptionId?: string }[]>([])
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([])
  const [language, setLanguage] = useState("English")
  const [subscriptions, setSubscriptions] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [schedulingType, setSchedulingType] = useState<"date" | "day" | "week">("date")
  const [subscriptionDay, setSubscriptionDay] = useState<number>(1)
  const [subscriptionWeek, setSubscriptionWeek] = useState<number>(1)
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date())

  const generateId = () => `batch_${Date.now()}_${Math.floor(Math.random() * 1000)}`

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const handleDateSelect = (date: Date | undefined) => {
    setScheduledDate(date)
  }

  const addCustomBatch = () => {
    setCustomBatches([...customBatches, { id: generateId(), time: "", subscriptionId: undefined }])
  }

  const removeCustomBatch = (id: string) => {
    setCustomBatches(customBatches.filter((batch) => batch.id !== id))
  }

  const updateCustomBatchTime = (id: string, time: string) => {
    setCustomBatches(customBatches.map((batch) => (batch.id === id ? { ...batch, time } : batch)))
  }

  const updateCustomBatchSubscription = (id: string, subscriptionId: string) => {
    setCustomBatches(
      customBatches.map((batch) =>
        batch.id === id ? { ...batch, subscriptionId: subscriptionId === "none" ? undefined : subscriptionId } : batch,
      ),
    )
  }

  const handleBatchToggle = (batchNumber: string) => {
    if (selectedBatches.includes(batchNumber)) {
      setSelectedBatches(selectedBatches.filter((b) => b !== batchNumber))
    } else {
      setSelectedBatches([...selectedBatches, batchNumber])
    }
  }

  async function fetchSubscriptions() {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.from("subscriptions").select("id, name").order("name")

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

    if (schedulingType === "date" && !scheduledDate) {
      newErrors.date = "Date is required"
    }

    if (isPredefinedBatch) {
      if (selectedBatches.length === 0) {
        newErrors.batches = "Please select at least one batch"
      }
    } else {
      if (customBatches.length === 0) {
        newErrors.customBatches = "Please add at least one custom batch time"
      } else {
        const invalidBatches = customBatches.filter((batch) => !batch.time.trim())
        if (invalidBatches.length > 0) {
          newErrors.customBatches = "All custom batch times must be filled"
        }
      }
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

      // Step 1: Create the main course record
      const courseData: any = {
        title,
        description,
        youtube_link: youtubeLink,
        language,
        scheduling_type: schedulingType,
      }

      // Add scheduling fields
      if (schedulingType === "date") {
        courseData.scheduled_date = scheduledDate ? scheduledDate.toISOString().split("T")[0] : null
        courseData.subscription_day = null
        courseData.subscription_week = null
      } else if (schedulingType === "day") {
        courseData.scheduled_date = null
        courseData.subscription_day = subscriptionDay
        courseData.subscription_week = null
      } else if (schedulingType === "week") {
        courseData.scheduled_date = null
        courseData.subscription_day = null
        courseData.subscription_week = subscriptionWeek
      }

      // Insert the course
      const { data: courseResult, error: courseError } = await supabase
        .from("courses")
        .insert([courseData])
        .select()
        .single()

      if (courseError) throw courseError

      const courseId = courseResult.id

      // Step 2: Create batch records
      const batchEntries = []

      if (isPredefinedBatch) {
        // Handle predefined batches with subscription assignments
        for (const batchNumber of selectedBatches) {
          if (selectedSubscriptions.length > 0 && !selectedSubscriptions.includes("none")) {
            // Create batch for each selected subscription
            for (const subscriptionId of selectedSubscriptions) {
              batchEntries.push({
                course_id: courseId,
                batch_number: batchNumber,
                custom_batch_time: null,
                is_predefined_batch: true,
                subscription_id: Number.parseInt(subscriptionId),
              })
            }
          } else {
            // Create batch without subscription (free)
            batchEntries.push({
              course_id: courseId,
              batch_number: batchNumber,
              custom_batch_time: null,
              is_predefined_batch: true,
              subscription_id: null,
            })
          }
        }
      } else {
        // Handle custom batches
        for (const batch of customBatches) {
          if (batch.time.trim()) {
            batchEntries.push({
              course_id: courseId,
              batch_number: null,
              custom_batch_time: batch.time,
              is_predefined_batch: false,
              subscription_id: batch.subscriptionId ? Number.parseInt(batch.subscriptionId) : null,
            })
          }
        }
      }

      // Insert all batch records
      if (batchEntries.length > 0) {
        const { error: batchError } = await supabase.from("course_batches").insert(batchEntries)
        if (batchError) throw batchError
      }

      router.push("/admin/courses")
    } catch (error) {
      console.error("Error creating course:", error)
      setErrors({ submit: "Failed to create course. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Create Course</h1>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>Create a new course with multiple batch timeslots</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {errors.submit && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}

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
              </div>

              {/* Scheduling Type */}
              <div className="space-y-2">
                <Label htmlFor="scheduling-type">Scheduling Type</Label>
                <Select
                  value={schedulingType}
                  onValueChange={(value) => setSchedulingType(value as "date" | "day" | "week")}
                >
                  <SelectTrigger id="scheduling-type">
                    <SelectValue placeholder="Select scheduling type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Specific Date</SelectItem>
                    <SelectItem value="day">Subscription Day</SelectItem>
                    <SelectItem value="week">Subscription Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date/Day/Week Fields */}
              {schedulingType === "date" && (
                <div className="space-y-2">
                  <Label htmlFor="scheduled-date">Scheduled Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !scheduledDate && "text-muted-foreground",
                        )}
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={scheduledDate} onSelect={handleDateSelect} initialFocus />
                    </PopoverContent>
                  </Popover>
                  {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
                </div>
              )}

              {schedulingType === "day" && (
                <div className="space-y-2">
                  <Label htmlFor="subscription-day">Subscription Day</Label>
                  <Input
                    id="subscription-day"
                    type="number"
                    min="1"
                    value={subscriptionDay}
                    onChange={(e) => setSubscriptionDay(Number.parseInt(e.target.value) || 1)}
                    placeholder="Day number (e.g., 1, 2, 3...)"
                  />
                </div>
              )}

              {schedulingType === "week" && (
                <div className="space-y-2">
                  <Label htmlFor="subscription-week">Subscription Week</Label>
                  <Input
                    id="subscription-week"
                    type="number"
                    min="1"
                    value={subscriptionWeek}
                    onChange={(e) => setSubscriptionWeek(Number.parseInt(e.target.value) || 1)}
                    placeholder="Week number (e.g., 1, 2, 3...)"
                  />
                </div>
              )}

              {/* Batch Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="predefined-batch" checked={isPredefinedBatch} onCheckedChange={setIsPredefinedBatch} />
                  <Label htmlFor="predefined-batch">Use predefined batch times</Label>
                </div>

                {isPredefinedBatch ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Batches</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
                          { id: "1", label: "Morning Batch 1 (5:30 to 6:30)" },
                          { id: "2", label: "Morning Batch 2 (6:40 to 7:40)" },
                          { id: "3", label: "Morning Batch 3 (7:50 to 8:50)" },
                          { id: "4", label: "Evening Batch 4 (5:30 to 6:30)" },
                          { id: "5", label: "Evening Batch 5 (6:40 to 7:40)" },
                          { id: "6", label: "Evening Batch 6 (7:50 to 8:50)" },
                        ].map((batch) => (
                          <div key={batch.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`batch-${batch.id}`}
                              checked={selectedBatches.includes(batch.id)}
                              onCheckedChange={() => handleBatchToggle(batch.id)}
                            />
                            <Label htmlFor={`batch-${batch.id}`}>{batch.label}</Label>
                          </div>
                        ))}
                      </div>
                      {errors.batches && <p className="text-sm text-red-500">{errors.batches}</p>}
                    </div>

                    {/* Global Subscription Selection for Predefined Batches */}
                    <div className="space-y-2">
                      <Label>Subscription Plans (applies to all selected batches)</Label>
                      <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                        <div className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id="no-subscription"
                            checked={selectedSubscriptions.includes("none")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSubscriptions(["none"])
                              } else {
                                setSelectedSubscriptions([])
                              }
                            }}
                          />
                          <Label htmlFor="no-subscription">No subscription required (Free)</Label>
                        </div>
                        {subscriptions.map((subscription) => (
                          <div key={subscription.id} className="flex items-center space-x-2 mb-2">
                            <Checkbox
                              id={`subscription-${subscription.id}`}
                              checked={selectedSubscriptions.includes(subscription.id.toString())}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubscriptions((prev) =>
                                    prev.filter((id) => id !== "none").concat(subscription.id.toString()),
                                  )
                                } else {
                                  setSelectedSubscriptions((prev) =>
                                    prev.filter((id) => id !== subscription.id.toString()),
                                  )
                                }
                              }}
                              disabled={selectedSubscriptions.includes("none")}
                            />
                            <Label htmlFor={`subscription-${subscription.id}`}>{subscription.name}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Custom Batch Times</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addCustomBatch}>
                        <Plus className="h-4 w-4 mr-2" /> Add Batch
                      </Button>
                    </div>

                    {customBatches.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No custom batches added yet. Click "Add Batch" to create one.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {customBatches.map((batch) => (
                          <div key={batch.id} className="border rounded-md p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <Input
                                value={batch.time}
                                onChange={(e) => updateCustomBatchTime(batch.id, e.target.value)}
                                placeholder="e.g., 9:00 AM to 10:00 AM"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeCustomBatch(batch.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <Label>Subscription for this batch</Label>
                              <Select
                                value={batch.subscriptionId || "none"}
                                onValueChange={(value) => updateCustomBatchSubscription(batch.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="No subscription required" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No subscription required (Free)</SelectItem>
                                  {subscriptions.map((subscription) => (
                                    <SelectItem key={subscription.id} value={subscription.id.toString()}>
                                      {subscription.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {errors.customBatches && <p className="text-sm text-red-500">{errors.customBatches}</p>}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/courses")}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Course"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  )
}
