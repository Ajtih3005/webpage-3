"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { format } from "date-fns"
import { CalendarIcon, RefreshCw, Save, Users, Plus, Trash2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface FreeSubscription {
  id: number
  name: string
  description: string | null
  price: number
  duration_days: number
  start_date?: string | null
  end_date?: string | null
  is_default_for_new_users?: boolean
  is_one_time_only?: boolean
  user_count?: number
}

interface Batch {
  id: number
  batch_name: string
  start_date: string
  end_date: string | null
  max_seats: number | null
  seats_taken: number
  is_active: boolean
  is_default: boolean
  created_at: string
  user_count?: number
}

interface Course {
  id: number
  title: string
  description: string | null
  youtube_link: string
  scheduled_date: string
  language: string
  subscription_id: number | null
}

export default function ManageFreeSubscription() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<FreeSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userCount, setUserCount] = useState<number>(0)
  const [loadingUserCount, setLoadingUserCount] = useState(false)
  const [columnsAvailable, setColumnsAvailable] = useState({
    start_date: false,
    end_date: false,
    is_default_for_new_users: false,
  })
  const [activeTab, setActiveTab] = useState("details")
  const [batches, setBatches] = useState<Batch[]>([])
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [tableMissing, setTableMissing] = useState(false)
  const [creatingTable, setCreatingTable] = useState(false)

  // New batch form state
  const [showNewBatchForm, setShowNewBatchForm] = useState(false)
  const [batchName, setBatchName] = useState("")
  const [batchStartDate, setBatchStartDate] = useState<Date | undefined>(new Date())
  const [batchEndDate, setBatchEndDate] = useState<Date | undefined>(undefined)
  const [maxSeats, setMaxSeats] = useState("")
  const [isDefault, setIsDefault] = useState(false)
  const [isIndefinite, setIsIndefinite] = useState(false)
  const [batchStartDateOpen, setBatchStartDateOpen] = useState(false)
  const [batchEndDateOpen, setBatchEndDateOpen] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchFreeSubscription()
  }, [])

  useEffect(() => {
    if (subscription?.id) {
      fetchBatches()
      fetchCourses()
    }
  }, [subscription?.id])

  async function checkColumnsExist() {
    try {
      const supabase = getSupabaseBrowserClient()

      // Try to get a subscription with all columns to see if they exist
      const { data, error } = await supabase
        .from("subscriptions")
        .select("start_date, end_date, is_default_for_new_users")
        .limit(1)
        .maybeSingle()

      // If no error, all columns exist
      if (!error) {
        setColumnsAvailable({
          start_date: true,
          end_date: true,
          is_default_for_new_users: true,
        })
        return true
      }

      // Otherwise, check each column individually
      const columns = {
        start_date: false,
        end_date: false,
        is_default_for_new_users: false,
      }

      // Check start_date
      const { error: startDateError } = await supabase.from("subscriptions").select("start_date").limit(1)

      if (!startDateError) columns.start_date = true

      // Check end_date
      const { error: endDateError } = await supabase.from("subscriptions").select("end_date").limit(1)

      if (!endDateError) columns.end_date = true

      // Check is_default_for_new_users
      const { error: defaultError } = await supabase.from("subscriptions").select("is_default_for_new_users").limit(1)

      if (!defaultError) columns.is_default_for_new_users = true

      setColumnsAvailable(columns)
      return columns.start_date && columns.end_date && columns.is_default_for_new_users
    } catch (error) {
      console.error("Error checking columns:", error)
      return false
    }
  }

  async function fetchFreeSubscription() {
    try {
      setLoading(true)
      setError(null)
      const supabase = getSupabaseBrowserClient()

      // Check if columns exist
      await checkColumnsExist()

      // Get the free subscription - using price = 0 as the main criteria
      let query = supabase.from("subscriptions").select("*").eq("price", 0)

      // Add is_default_for_new_users filter if available
      if (columnsAvailable.is_default_for_new_users) {
        query = query.eq("is_default_for_new_users", true)
      }

      const { data, error } = await query.maybeSingle()

      if (error) throw error

      if (!data) {
        // Create the free subscription if it doesn't exist
        const response = await fetch("/api/create-free-subscription")
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Failed to create free subscription")
        }

        // Fetch the newly created subscription
        const { data: newData, error: newError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("id", result.id)
          .single()

        if (newError) throw newError

        setSubscription(newData)
        if (newData.start_date) setStartDate(new Date(newData.start_date))
        if (newData.end_date) setEndDate(new Date(newData.end_date))
      } else {
        setSubscription(data)
        if (data.start_date) setStartDate(new Date(data.start_date))
        if (data.end_date) setEndDate(new Date(data.end_date))
      }

      // Fetch user count
      await fetchUserCount()
    } catch (error) {
      console.error("Error fetching free subscription:", error)
      setError(error instanceof Error ? error.message : "Failed to load free subscription")
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserCount() {
    try {
      setLoadingUserCount(true)
      const supabase = getSupabaseBrowserClient()

      if (!subscription?.id) return

      const { count, error } = await supabase
        .from("user_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("subscription_id", subscription.id)
        .eq("is_active", true)

      if (error) throw error

      setUserCount(count || 0)
    } catch (error) {
      console.error("Error fetching user count:", error)
    } finally {
      setLoadingUserCount(false)
    }
  }

  async function fetchBatches() {
    try {
      setLoadingBatches(true)
      const supabase = getSupabaseBrowserClient()

      if (!subscription?.id) return

      // Check if subscription_batches table exists
      try {
        const { data: batchesData, error: batchesError } = await supabase
          .from("subscription_batches")
          .select("*")
          .eq("subscription_id", subscription.id)
          .order("start_date", { ascending: false })

        if (batchesError) {
          // Check if the error is about the missing table
          if (batchesError.message.includes("relation") && batchesError.message.includes("does not exist")) {
            setTableMissing(true)
            setBatches([])
            return
          }
          throw batchesError
        }

        setTableMissing(false)

        // Get user counts for each batch
        const batchesWithCounts = await Promise.all(
          (batchesData || []).map(async (batch) => {
            const { count, error: countError } = await supabase
              .from("user_subscriptions")
              .select("*", { count: "exact", head: true })
              .eq("batch_id", batch.id)

            if (countError) {
              console.error(`Error fetching user count for batch ${batch.id}:`, countError)
              return { ...batch, user_count: 0 }
            }

            return { ...batch, user_count: count || 0 }
          }),
        )

        setBatches(batchesWithCounts)
      } catch (error) {
        console.error("Error fetching batches:", error)
        setTableMissing(true)
        setBatches([])
      }
    } catch (error) {
      console.error("Error in fetchBatches:", error)
    } finally {
      setLoadingBatches(false)
    }
  }

  async function fetchCourses() {
    try {
      setLoadingCourses(true)
      const supabase = getSupabaseBrowserClient()

      if (!subscription?.id) return

      // Get courses associated with this subscription
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("subscription_id", subscription.id)
        .order("scheduled_date", { ascending: false })

      if (error) throw error

      setCourses(data || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setLoadingCourses(false)
    }
  }

  async function handleSave() {
    if (!subscription || !startDate || !endDate) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      const supabase = getSupabaseBrowserClient()

      // Only update date columns if they exist
      if (columnsAvailable.start_date && columnsAvailable.end_date) {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            duration_days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
          })
          .eq("id", subscription.id)

        if (error) throw error

        setSuccess("Free subscription dates updated successfully")
      } else {
        setSuccess("Date columns not available in your database. Please run the migration first.")
      }

      fetchFreeSubscription() // Refresh data
    } catch (error) {
      console.error("Error updating free subscription:", error)
      setError(error instanceof Error ? error.message : "Failed to update free subscription")
    } finally {
      setSaving(false)
    }
  }

  async function handleViewUsers() {
    if (!subscription) return
    router.push(`/admin/subscriptions/users/${subscription.id}`)
  }

  async function createBatchesTable() {
    try {
      setCreatingTable(true)
      setError(null)

      const response = await fetch("/api/create-subscription-batches-table")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to create subscription batches table")
      }

      setSuccess("Subscription batches table created successfully!")
      setTableMissing(false)
      fetchBatches()
    } catch (err: any) {
      console.error("Error creating subscription batches table:", err)
      setError(err.message)
    } finally {
      setCreatingTable(false)
    }
  }

  const validateBatchForm = () => {
    const errors: Record<string, string> = {}

    if (!batchName.trim()) {
      errors.batchName = "Batch name is required"
    }

    if (!batchStartDate) {
      errors.batchStartDate = "Start date is required"
    }

    if (!isIndefinite && !batchEndDate) {
      errors.batchEndDate = "End date is required when not using indefinite duration"
    } else if (!isIndefinite && batchStartDate && batchEndDate && batchEndDate <= batchStartDate) {
      errors.batchEndDate = "End date must be after start date"
    }

    if (maxSeats && (isNaN(Number(maxSeats)) || Number(maxSeats) <= 0)) {
      errors.maxSeats = "Maximum seats must be a positive number"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateBatchForm() || !subscription) return

    try {
      setSubmitting(true)
      setSuccess(null)
      setError(null)
      const supabase = getSupabaseBrowserClient()

      // If this is set as default, unset any existing defaults
      if (isDefault) {
        await supabase
          .from("subscription_batches")
          .update({ is_default: false })
          .eq("subscription_id", subscription.id)
          .eq("is_default", true)
      }

      // Create the new batch
      const { data, error } = await supabase
        .from("subscription_batches")
        .insert([
          {
            subscription_id: subscription.id,
            batch_name: batchName,
            start_date: batchStartDate?.toISOString(),
            end_date: isIndefinite ? null : batchEndDate?.toISOString(),
            max_seats: maxSeats ? Number(maxSeats) : null,
            is_default: isDefault,
          },
        ])
        .select()

      if (error) throw error

      setSuccess("Batch created successfully!")
      setShowNewBatchForm(false)
      resetBatchForm()
      fetchBatches()
    } catch (err: any) {
      console.error("Error creating batch:", err)
      setError(`Failed to create batch: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const resetBatchForm = () => {
    setBatchName("")
    setBatchStartDate(new Date())
    setBatchEndDate(undefined)
    setMaxSeats("")
    setIsDefault(false)
    setIsIndefinite(false)
    setFormErrors({})
  }

  const toggleBatchActive = async (batchId: number, currentStatus: boolean) => {
    try {
      setError(null)
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase
        .from("subscription_batches")
        .update({ is_active: !currentStatus })
        .eq("id", batchId)

      if (error) throw error

      // Update local state
      setBatches((prev) =>
        prev.map((batch) => (batch.id === batchId ? { ...batch, is_active: !currentStatus } : batch)),
      )
    } catch (err: any) {
      console.error("Error toggling batch status:", err)
      setError(`Failed to update batch: ${err.message}`)
    }
  }

  const deleteBatch = async (batchId: number) => {
    if (!confirm("Are you sure you want to delete this batch? This will NOT remove users from the subscription.")) {
      return
    }

    try {
      setError(null)
      const supabase = getSupabaseBrowserClient()

      // Check if batch has users
      const { count, error: countError } = await supabase
        .from("user_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("batch_id", batchId)

      if (countError) throw countError

      if (count && count > 0) {
        if (
          !confirm(
            `This batch has ${count} users. Deleting it will remove the batch association but NOT the subscription. Continue?`,
          )
        ) {
          return
        }

        // Update user_subscriptions to remove batch_id
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({ batch_id: null })
          .eq("batch_id", batchId)

        if (updateError) throw updateError
      }

      // Delete the batch
      const { error } = await supabase.from("subscription_batches").delete().eq("id", batchId)

      if (error) throw error

      setSuccess("Batch deleted successfully!")
      // Update local state
      setBatches((prev) => prev.filter((batch) => batch.id !== batchId))
    } catch (err: any) {
      console.error("Error deleting batch:", err)
      setError(`Failed to delete batch: ${err.message}`)
    }
  }

  const viewBatchUsers = (batchId: number) => {
    router.push(`/admin/subscriptions/batches/users/${batchId}`)
  }

  const handleAddCourse = () => {
    if (!subscription) return
    router.push(`/admin/courses/create?subscription=${subscription.id}`)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Free Subscription</h1>
          <Button variant="outline" onClick={fetchFreeSubscription} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {!columnsAvailable.start_date || !columnsAvailable.end_date || !columnsAvailable.is_default_for_new_users ? (
          <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
            <AlertTitle>Database Schema Warning</AlertTitle>
            <AlertDescription>
              Some required columns are missing in your database. Please run the migration SQL to add the necessary
              columns:
              <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-x-auto">
                {`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_default_for_new_users BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_one_time_only BOOLEAN DEFAULT FALSE;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS is_one_time_subscription BOOLEAN DEFAULT FALSE;`}
              </pre>
            </AlertDescription>
          </Alert>
        ) : null}

        {tableMissing && (
          <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
            <AlertTitle>Batch Management Not Available</AlertTitle>
            <AlertDescription>
              The subscription batches table does not exist in your database yet.
              <Button onClick={createBatchesTable} disabled={creatingTable} className="ml-4">
                {creatingTable ? "Creating Table..." : "Create Batches Table Now"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-[400px]">
            <TabsTrigger value="details">Subscription Details</TabsTrigger>
            <TabsTrigger value="batches">Batches</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Free Subscription Details</CardTitle>
                <CardDescription>
                  This subscription is automatically assigned to new users when they register
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm text-gray-500">Subscription Name</Label>
                        <p className="text-lg font-medium">{subscription?.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Duration</Label>
                        <p className="text-lg font-medium">{subscription?.duration_days} days</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Price</Label>
                        <p className="text-lg font-medium">₹{subscription?.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Active Users</Label>
                        <p className="text-lg font-medium">
                          {loadingUserCount ? <Skeleton className="h-6 w-16 inline-block" /> : userCount}
                        </p>
                      </div>
                    </div>

                    {columnsAvailable.start_date && columnsAvailable.end_date && (
                      <div className="border-t pt-6 mt-6">
                        <h3 className="text-lg font-medium mb-4">Update Subscription Dates</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Start Date */}
                          <div className="space-y-2">
                            <Label htmlFor="start-date">Start Date</Label>
                            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  id="start-date"
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !startDate && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={startDate}
                                  onSelect={(date) => {
                                    setStartDate(date)
                                    setStartDateOpen(false)
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* End Date */}
                          <div className="space-y-2">
                            <Label htmlFor="end-date">End Date</Label>
                            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  id="end-date"
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !endDate && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={endDate}
                                  onSelect={(date) => {
                                    setEndDate(date)
                                    setEndDateOpen(false)
                                  }}
                                  disabled={(date) => date < (startDate || new Date())}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleViewUsers} disabled={loading || !subscription}>
                  <Users className="mr-2 h-4 w-4" /> View Subscribed Users
                </Button>
                {columnsAvailable.start_date && columnsAvailable.end_date && (
                  <Button onClick={handleSave} disabled={loading || saving || !startDate || !endDate}>
                    <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="batches" className="space-y-4 mt-6">
            {tableMissing ? (
              <Card>
                <CardHeader>
                  <CardTitle>Batch Management</CardTitle>
                  <CardDescription>Create and manage batches for the free subscription</CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
                    <AlertTitle>Batch Management Not Available</AlertTitle>
                    <AlertDescription>
                      The subscription batches table does not exist in your database yet.
                      <Button onClick={createBatchesTable} disabled={creatingTable} className="ml-4">
                        {creatingTable ? "Creating Table..." : "Create Batches Table Now"}
                      </Button>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Manage Batches</h2>
                  <Button onClick={() => setShowNewBatchForm(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add New Batch
                  </Button>
                </div>

                {showNewBatchForm && (
                  <Card>
                    <form onSubmit={handleCreateBatch}>
                      <CardHeader>
                        <CardTitle>Create New Batch</CardTitle>
                        <CardDescription>Add a new batch for the free subscription</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="batch-name">Batch Name</Label>
                          <Input
                            id="batch-name"
                            value={batchName}
                            onChange={(e) => setBatchName(e.target.value)}
                            placeholder="e.g., Summer 2023, Batch #4"
                          />
                          {formErrors.batchName && <p className="text-sm text-red-500">{formErrors.batchName}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="batch-start-date">Start Date</Label>
                          <Popover open={batchStartDateOpen} onOpenChange={setBatchStartDateOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                id="batch-start-date"
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !batchStartDate && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {batchStartDate ? format(batchStartDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={batchStartDate}
                                onSelect={(date) => {
                                  setBatchStartDate(date)
                                  setBatchStartDateOpen(false)
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          {formErrors.batchStartDate && (
                            <p className="text-sm text-red-500">{formErrors.batchStartDate}</p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 mt-4">
                          <Switch id="indefinite-batch" checked={isIndefinite} onCheckedChange={setIsIndefinite} />
                          <Label htmlFor="indefinite-batch">Indefinite batch (no end date)</Label>
                        </div>

                        {!isIndefinite && (
                          <div className="space-y-2">
                            <Label htmlFor="batch-end-date">End Date</Label>
                            <Popover open={batchEndDateOpen} onOpenChange={setBatchEndDateOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  id="batch-end-date"
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !batchEndDate && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {batchEndDate ? format(batchEndDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={batchEndDate}
                                  onSelect={(date) => {
                                    setBatchEndDate(date)
                                    setBatchEndDateOpen(false)
                                  }}
                                  disabled={(date) => date < (batchStartDate || new Date())}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            {formErrors.batchEndDate && (
                              <p className="text-sm text-red-500">{formErrors.batchEndDate}</p>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="max-seats">Maximum Seats (Optional)</Label>
                          <Input
                            id="max-seats"
                            type="number"
                            min="1"
                            value={maxSeats}
                            onChange={(e) => setMaxSeats(e.target.value)}
                            placeholder="Leave empty for unlimited"
                          />
                          {formErrors.maxSeats && <p className="text-sm text-red-500">{formErrors.maxSeats}</p>}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div>
                            <Label htmlFor="is-default" className="font-medium">
                              Default Batch
                            </Label>
                            <p className="text-sm text-gray-500">
                              New users will be automatically assigned to this batch when subscribing
                            </p>
                          </div>
                          <Switch id="is-default" checked={isDefault} onCheckedChange={setIsDefault} />
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button type="button" variant="outline" onClick={() => setShowNewBatchForm(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                          {submitting ? "Creating..." : "Create Batch"}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Batches</CardTitle>
                    <CardDescription>
                      Manage time-based batches for the free subscription. Each batch has its own start and end dates.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingBatches ? (
                      <div className="flex justify-center py-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
                      </div>
                    ) : batches.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No batches found for this subscription.</p>
                        <Button className="mt-4" onClick={() => setShowNewBatchForm(true)}>
                          <Plus className="mr-2 h-4 w-4" /> Create First Batch
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Batch Name</TableHead>
                              <TableHead>Start Date</TableHead>
                              <TableHead>End Date</TableHead>
                              <TableHead>Seats</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Default</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {batches.map((batch) => {
                              const now = new Date()
                              const startDate = new Date(batch.start_date)
                              const endDate = batch.end_date ? new Date(batch.end_date) : null
                              const isUpcoming = startDate > now
                              const isActive = startDate <= now && (!endDate || endDate >= now)
                              const isExpired = endDate && endDate < now

                              return (
                                <TableRow key={batch.id}>
                                  <TableCell className="font-medium">{batch.batch_name}</TableCell>
                                  <TableCell>{format(startDate, "MMM d, yyyy")}</TableCell>
                                  <TableCell>{endDate ? format(endDate, "MMM d, yyyy") : "Indefinite"}</TableCell>
                                  <TableCell>
                                    {batch.max_seats ? (
                                      <span>
                                        {batch.seats_taken} / {batch.max_seats}
                                      </span>
                                    ) : (
                                      <span>{batch.seats_taken} / ∞</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {isExpired ? (
                                      <Badge variant="outline" className="bg-gray-100">
                                        Expired
                                      </Badge>
                                    ) : isActive ? (
                                      <Badge variant="default" className="bg-green-600">
                                        Active
                                      </Badge>
                                    ) : isUpcoming ? (
                                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                        Upcoming
                                      </Badge>
                                    ) : (
                                      <Badge variant={batch.is_active ? "default" : "outline"}>
                                        {batch.is_active ? "Active" : "Inactive"}
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Switch
                                      checked={batch.is_default}
                                      onCheckedChange={() => toggleBatchActive(batch.id, batch.is_active)}
                                      disabled={isExpired}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => viewBatchUsers(batch.id)}
                                        disabled={batch.user_count === 0}
                                      >
                                        <Users className="h-4 w-4 mr-1" />
                                        {batch.user_count || 0}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleBatchActive(batch.id, batch.is_active)}
                                        disabled={isExpired}
                                      >
                                        {batch.is_active ? "Deactivate" : "Activate"}
                                      </Button>
                                      <Button variant="outline" size="icon" onClick={() => deleteBatch(batch.id)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="courses" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Associated Courses</h2>
              <Button onClick={handleAddCourse}>
                <Plus className="mr-2 h-4 w-4" /> Add Course
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Free Subscription Courses</CardTitle>
                <CardDescription>Courses that are available with the free subscription</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCourses ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No courses found for this subscription.</p>
                    <Button className="mt-4" onClick={handleAddCourse}>
                      <Plus className="mr-2 h-4 w-4" /> Add First Course
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Language</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courses.map((course) => (
                          <TableRow key={course.id}>
                            <TableCell className="font-medium">{course.title}</TableCell>
                            <TableCell>{format(new Date(course.scheduled_date), "MMM d, yyyy")}</TableCell>
                            <TableCell>{course.language}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/admin/courses/edit/${course.id}`)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/admin/courses/view/${course.id}`)}
                                >
                                  View
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
