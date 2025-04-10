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

// Update the component to include multiple batches functionality
export default function CreateCourse() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [youtubeLink, setYoutubeLink] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isPredefinedBatch, setIsPredefinedBatch] = useState(true)
  const [isScheduledSession, setIsScheduledSession] = useState(false)
  const [selectedBatches, setSelectedBatches] = useState<string[]>([])
  const [customBatches, setCustomBatches] = useState<{ id: string; time: string }[]>([])
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"])
  const [subscriptions, setSubscriptions] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Available languages
  const availableLanguages = ["English", "Hindi", "Kannada"]

  // Generate a unique ID for custom batches
  const generateId = () => `batch_${Date.now()}_${Math.floor(Math.random() * 1000)}`

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  // Handle scheduled session toggle
  useEffect(() => {
    if (isScheduledSession) {
      // Select all predefined batches when scheduled session is enabled
      setSelectedBatches(["1", "2", "3", "4", "5", "6"])
      setIsPredefinedBatch(true)
    } else if (isPredefinedBatch) {
      // Reset to empty selection when turning off scheduled session
      setSelectedBatches([])
    }
  }, [isScheduledSession])

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
    if (selectedLanguages.length === 0) newErrors.languages = "Please select at least one language"

    if (isPredefinedBatch) {
      if (selectedBatches.length === 0) {
        newErrors.batches = "Please select at least one batch"
      }
    } else {
      if (customBatches.length === 0) {
        newErrors.customBatches = "Please add at least one custom batch time"
      } else {
        // Validate each custom batch
        const invalidBatches = customBatches.filter((batch) => !batch.time.trim())
        if (invalidBatches.length > 0) {
          newErrors.customBatches = "All custom batch times must be filled"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addCustomBatch = () => {
    setCustomBatches([...customBatches, { id: generateId(), time: "" }])
  }

  const removeCustomBatch = (id: string) => {
    setCustomBatches(customBatches.filter((batch) => batch.id !== id))
  }

  const updateCustomBatchTime = (id: string, time: string) => {
    setCustomBatches(customBatches.map((batch) => (batch.id === id ? { ...batch, time } : batch)))
  }

  const handleBatchToggle = (batchNumber: string) => {
    if (selectedBatches.includes(batchNumber)) {
      setSelectedBatches(selectedBatches.filter((b) => b !== batchNumber))
    } else {
      setSelectedBatches([...selectedBatches, batchNumber])
    }
  }

  const handleLanguageToggle = (language: string) => {
    if (selectedLanguages.includes(language)) {
      // Only remove if it's not the last language
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter((l) => l !== language))
      }
    } else {
      setSelectedLanguages([...selectedLanguages, language])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)
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

      console.log("Submitting with date:", formattedDate, "Original date object:", date)

      // Create courses for each selected language
      for (const language of selectedLanguages) {
        if (isPredefinedBatch && selectedBatches.length > 0) {
          // Create multiple courses for predefined batches
          const coursesToInsert = selectedBatches.map((batchNumber) => ({
            title,
            description,
            youtube_link: youtubeLink,
            scheduled_date: formattedDate,
            is_predefined_batch: true,
            batch_number: batchNumber,
            custom_batch_time: null,
            subscription_id: subscriptionId && subscriptionId !== "none" ? Number.parseInt(subscriptionId) : null,
            language,
          }))

          console.log("Inserting courses with date:", formattedDate, "First course:", coursesToInsert[0])
          const { data, error } = await supabase.from("courses").insert(coursesToInsert).select()

          if (error) {
            console.error("Error inserting courses:", error)
            throw error
          }

          console.log("Inserted courses:", data)
        } else if (!isPredefinedBatch && customBatches.length > 0) {
          // Create multiple courses for custom batches
          const coursesToInsert = customBatches.map((batch) => ({
            title,
            description,
            youtube_link: youtubeLink,
            scheduled_date: formattedDate,
            is_predefined_batch: false,
            batch_number: null,
            custom_batch_time: batch.time,
            subscription_id: subscriptionId && subscriptionId !== "none" ? Number.parseInt(subscriptionId) : null,
            language,
          }))

          console.log("Inserting custom batch courses with date:", formattedDate)
          const { data, error } = await supabase.from("courses").insert(coursesToInsert).select()

          if (error) {
            console.error("Error inserting custom batch courses:", error)
            throw error
          }
        }
      }

      router.push("/admin/courses")
    } catch (error) {
      console.error("Error creating course:", error)
      alert("Error creating course. Please check the console for details.")
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
              <CardDescription>Create a new course for your users</CardDescription>
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

              {/* Language Selection - Updated to allow multiple languages */}
              <div className="space-y-2">
                <Label>Languages</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {availableLanguages.map((language) => (
                    <div key={language} className="flex items-center space-x-2">
                      <Checkbox
                        id={`language-${language}`}
                        checked={selectedLanguages.includes(language)}
                        onCheckedChange={() => handleLanguageToggle(language)}
                        disabled={selectedLanguages.length === 1 && selectedLanguages.includes(language)}
                      />
                      <Label htmlFor={`language-${language}`}>{language}</Label>
                    </div>
                  ))}
                </div>
                {errors.languages && <p className="text-sm text-red-500">{errors.languages}</p>}
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
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
              </div>

              {/* Batch Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="predefined-batch"
                    checked={isPredefinedBatch}
                    onCheckedChange={(checked) => {
                      setIsPredefinedBatch(checked)
                      if (checked) {
                        setIsScheduledSession(false)
                      }
                    }}
                  />
                  <Label htmlFor="predefined-batch">Use predefined batch times</Label>
                </div>

                {isPredefinedBatch && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="scheduled-session"
                        checked={isScheduledSession}
                        onCheckedChange={setIsScheduledSession}
                      />
                      <Label htmlFor="scheduled-session">This is a scheduled session (all batches)</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>Select Batches</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="batch-1"
                            checked={selectedBatches.includes("1")}
                            onCheckedChange={() => handleBatchToggle("1")}
                            disabled={isScheduledSession}
                          />
                          <Label htmlFor="batch-1">Morning Batch 1 (5:30 to 6:30)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="batch-2"
                            checked={selectedBatches.includes("2")}
                            onCheckedChange={() => handleBatchToggle("2")}
                            disabled={isScheduledSession}
                          />
                          <Label htmlFor="batch-2">Morning Batch 2 (6:40 to 7:40)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="batch-3"
                            checked={selectedBatches.includes("3")}
                            onCheckedChange={() => handleBatchToggle("3")}
                            disabled={isScheduledSession}
                          />
                          <Label htmlFor="batch-3">Morning Batch 3 (7:50 to 8:50)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="batch-4"
                            checked={selectedBatches.includes("4")}
                            onCheckedChange={() => handleBatchToggle("4")}
                            disabled={isScheduledSession}
                          />
                          <Label htmlFor="batch-4">Evening Batch 4 (5:30 to 6:30)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="batch-5"
                            checked={selectedBatches.includes("5")}
                            onCheckedChange={() => handleBatchToggle("5")}
                            disabled={isScheduledSession}
                          />
                          <Label htmlFor="batch-5">Evening Batch 5 (6:40 to 7:40)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="batch-6"
                            checked={selectedBatches.includes("6")}
                            onCheckedChange={() => handleBatchToggle("6")}
                            disabled={isScheduledSession}
                          />
                          <Label htmlFor="batch-6">Evening Batch 6 (7:50 to 8:50)</Label>
                        </div>
                      </div>
                      {errors.batches && <p className="text-sm text-red-500">{errors.batches}</p>}
                    </div>
                  </div>
                )}

                {!isPredefinedBatch && (
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
                          <div key={batch.id} className="flex items-center gap-2">
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
                        ))}
                      </div>
                    )}
                    {errors.customBatches && <p className="text-sm text-red-500">{errors.customBatches}</p>}
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
