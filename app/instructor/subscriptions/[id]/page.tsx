"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, DollarSign, Calendar, CheckCircle, Plus, Bell, BookOpen } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface SubscriptionPageProps {
  params: {
    id: string
  }
}

const SubscriptionPage = ({ params }: SubscriptionPageProps) => {
  const router = useRouter()
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [showSendNotification, setShowSendNotification] = useState(false)
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    youtube_link: "",
    duration_minutes: "",
  })
  const [notification, setNotification] = useState({
    title: "",
    message: "",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Check instructor authentication
    const instructorAuth = localStorage.getItem("instructorAuthenticated")
    if (instructorAuth !== "true") {
      router.push("/instructor/login")
      return
    }
    setIsAuthenticated(true)

    // Fetch subscription details
    fetchSubscriptionDetails()
  }, [params.id, router])

  const fetchSubscriptionDetails = async () => {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("subscriptions").select("*").eq("id", params.id).single()

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      console.log("Fetched subscription:", data)
      setSubscription(data)

      // Also fetch courses for this subscription
      await fetchSubscriptionCourses()
    } catch (error: any) {
      console.error("Error fetching subscription:", error)
      setError("Failed to load subscription details")
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptionCourses = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("subscription_id", params.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const handleAddCourse = async () => {
    try {
      setSubmitting(true)
      const supabase = getSupabaseBrowserClient()
      const instructorId = localStorage.getItem("instructorId")

      const { error } = await supabase.from("courses").insert({
        title: newCourse.title,
        description: newCourse.description,
        youtube_link: newCourse.youtube_link,
        duration_minutes: Number.parseInt(newCourse.duration_minutes) || null,
        subscription_id: params.id,
        instructor_id: instructorId,
        created_by_type: "instructor",
      })

      if (error) throw error

      setNewCourse({ title: "", description: "", youtube_link: "", duration_minutes: "" })
      setShowAddCourse(false)
      fetchSubscriptionCourses()
      alert("Course added successfully!")
    } catch (error) {
      console.error("Error adding course:", error)
      alert("Failed to add course")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendNotification = async () => {
    try {
      setSubmitting(true)
      const supabase = getSupabaseBrowserClient()
      const instructorId = localStorage.getItem("instructorId")

      const { error } = await supabase.from("notifications").insert({
        title: notification.title,
        message: notification.message,
        target_subscription_id: params.id,
        created_by: instructorId,
        created_by_type: "instructor",
      })

      if (error) throw error

      setNotification({ title: "", message: "" })
      setShowSendNotification(false)
      alert("Notification sent successfully!")
    } catch (error) {
      console.error("Error sending notification:", error)
      alert("Failed to send notification")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      </div>
    )
  }

  if (error || !subscription) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The subscription you are looking for does not exist."}</p>
          <Link href="/instructor/subscriptions">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subscriptions
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/instructor/subscriptions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-gray-900">{subscription.name}</h1>
            <p className="text-gray-600">Subscription Details</p>
          </div>
        </div>
        <Badge variant={subscription.is_active ? "default" : "secondary"}>
          {subscription.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Read-only notice */}
      <div className="rounded-md border bg-muted p-4 mb-6">
        <p className="text-sm text-muted-foreground">
          This subscription is managed by an administrator. You have read-only access to view the details.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Button onClick={() => setShowAddCourse(true)} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
        <Button onClick={() => setShowSendNotification(true)} variant="outline" className="flex items-center">
          <Bell className="h-4 w-4 mr-2" />
          Send Notification
        </Button>
      </div>

      {/* Add Course Modal */}
      {showAddCourse && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Course to {subscription.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Course Title</label>
              <Input
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                placeholder="Enter course title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                placeholder="Enter course description"
              />
            </div>
            <div>
              <label className="text-sm font-medium">YouTube Link</label>
              <Input
                value={newCourse.youtube_link}
                onChange={(e) => setNewCourse({ ...newCourse, youtube_link: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input
                type="number"
                value={newCourse.duration_minutes}
                onChange={(e) => setNewCourse({ ...newCourse, duration_minutes: e.target.value })}
                placeholder="60"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddCourse} disabled={submitting}>
                {submitting ? "Adding..." : "Add Course"}
              </Button>
              <Button variant="outline" onClick={() => setShowAddCourse(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send Notification Modal */}
      {showSendNotification && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Send Notification to {subscription.name} Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notification Title</label>
              <Input
                value={notification.title}
                onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                placeholder="Enter notification title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={notification.message}
                onChange={(e) => setNotification({ ...notification, message: e.target.value })}
                placeholder="Enter your message to subscribers"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSendNotification} disabled={submitting}>
                {submitting ? "Sending..." : "Send Notification"}
              </Button>
              <Button variant="outline" onClick={() => setShowSendNotification(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <p className="text-gray-900">{subscription.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <p className="text-gray-900">{subscription.description || "No description available"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Price</label>
              <p className="text-gray-900">₹{subscription.price || 0}</p>
            </div>
            {subscription.duration_days && (
              <div>
                <label className="text-sm font-medium text-gray-700">Duration</label>
                <p className="text-gray-900">{subscription.duration_days} days</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status & Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Status & Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <Badge variant={subscription.is_active ? "default" : "secondary"}>
                {subscription.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Created</span>
              <span className="text-sm text-gray-600">{new Date(subscription.created_at).toLocaleDateString()}</span>
            </div>
            {subscription.updated_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Last Updated</span>
                <span className="text-sm text-gray-600">{new Date(subscription.updated_at).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        {subscription.features && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Features
              </CardTitle>
              <CardDescription>What's included in this subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {(typeof subscription.features === "string"
                  ? subscription.features.split(",")
                  : subscription.features
                ).map((feature: string, index: number) => (
                  <div key={index} className="flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm">{feature.trim()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Courses for this Subscription */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Courses ({courses.length})
            </CardTitle>
            <CardDescription>Courses available for this subscription</CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {courses.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4">
                    <h4 className="font-medium">{course.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                    {course.duration_minutes && (
                      <p className="text-xs text-gray-500 mt-2">{course.duration_minutes} minutes</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="outline">{new Date(course.created_at).toLocaleDateString()}</Badge>
                      {course.youtube_link && (
                        <a
                          href={course.youtube_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Video
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No courses added to this subscription yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SubscriptionPage
