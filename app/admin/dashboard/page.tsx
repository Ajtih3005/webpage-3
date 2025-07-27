"use client"

import { useEffect, useState } from "react"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Bell, BookOpenCheck, Menu, X, CreditCard, RefreshCw } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DashboardStats {
  totalUsers: number
  totalCourses: number
  totalNotifications: number
  upcomingCourses: number
  subscriptionStats: {
    basic: number
    premium: number
    pro: number
    total: number
  }
  revenueStats: {
    monthly: number
    quarterly: number
    annual: number
  }
  videoStats: {
    totalViews: number
    completionRate: number
    mostViewedTitle: string
    mostViewedCount: number
  }
}

interface SubscriptionData {
  name: string
  count: number
  revenue: number
  color: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalNotifications: 0,
    upcomingCourses: 0,
    subscriptionStats: {
      basic: 0,
      premium: 0,
      pro: 0,
      total: 0,
    },
    revenueStats: {
      monthly: 0,
      quarterly: 0,
      annual: 0,
    },
    videoStats: {
      totalViews: 0,
      completionRate: 0,
      mostViewedTitle: "",
      mostViewedCount: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData[]>([])
  const [monthlyGrowth, setMonthlyGrowth] = useState<{ month: string; count: number; percentage: number }[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [tableInfo, setTableInfo] = useState<{ [key: string]: string[] }>({})

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      setErrors([])
      const supabase = getSupabaseBrowserClient()
      const newErrors: string[] = []
      const tableColumns: { [key: string]: string[] } = {}

      // Get total users - using count directly
      const { count: userCount, error: userError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })

      if (userError) {
        console.error("Error fetching users:", userError)
        newErrors.push(`Error fetching users: ${userError.message}`)
      }

      // Get total courses - using count directly
      const { count: courseCount, error: courseError } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })

      if (courseError) {
        console.error("Error fetching courses:", courseError)
        newErrors.push(`Error fetching courses: ${courseError.message}`)
      }

      // Get total notifications - using count directly
      const { count: notificationCount, error: notificationError } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })

      if (notificationError) {
        console.error("Error fetching notifications:", notificationError)
        newErrors.push(`Error fetching notifications: ${notificationError.message}`)
      }

      // Get upcoming courses (scheduled for today or later)
      const today = new Date().toISOString().split("T")[0]
      const { count: upcomingCount, error: upcomingError } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .gte("scheduled_date", today)

      if (upcomingError) {
        console.error("Error fetching upcoming courses:", upcomingError)
        newErrors.push(`Error fetching upcoming courses: ${upcomingError.message}`)
      }

      // Get table information for user_subscriptions
      try {
        // First, get a sample row to inspect columns
        const { data: sampleSubscription, error: sampleError } = await supabase
          .from("user_subscriptions")
          .select("*")
          .limit(1)

        if (sampleError) {
          console.error("Error fetching sample subscription:", sampleError)
          newErrors.push(`Error fetching sample subscription: ${sampleError.message}`)
        } else if (sampleSubscription && sampleSubscription.length > 0) {
          // Store column names for debugging
          tableColumns["user_subscriptions"] = Object.keys(sampleSubscription[0])
        }
      } catch (error) {
        console.error("Error inspecting user_subscriptions table:", error)
      }

      // Get subscription data - fetch all subscriptions without filtering by status
      const { data: subscriptions, error: subscriptionError } = await supabase
        .from("user_subscriptions")
        .select(`
          id,
          subscription_id,
          is_active,
          subscriptions (
            id,
            name,
            price
          )
        `)
        // If is_active column exists, filter by it
        .eq("is_active", true)

      if (subscriptionError) {
        // If the is_active filter failed, try without it
        console.error("Error fetching subscriptions with is_active filter:", subscriptionError)

        const { data: allSubscriptions, error: allSubError } = await supabase.from("user_subscriptions").select(`
            id,
            subscription_id,
            subscriptions (
              id,
              name,
              price
            )
          `)

        if (allSubError) {
          console.error("Error fetching all subscriptions:", allSubError)
          newErrors.push(`Error fetching subscriptions: ${allSubError.message}`)
        } else {
          // Use all subscriptions instead
          console.log("Using all subscriptions without filtering")
          const subscriptions = allSubscriptions as any
        }
      }

      // Get video analytics data directly from user_courses and courses
      let videoStats = {
        totalViews: 0,
        completionRate: 0,
        mostViewedTitle: "",
        mostViewedCount: 0,
      }

      // Get courses with their user_courses data
      const { data: coursesWithUserData, error: coursesError } = await supabase.from("courses").select(`
          id,
          title,
          user_courses (
            id,
            attended,
            completed_video
          )
        `)

      if (coursesError) {
        console.error("Error fetching courses with user data:", coursesError)
        newErrors.push(`Error fetching courses with user data: ${coursesError.message}`)
      } else if (coursesWithUserData) {
        // Process courses to get video analytics
        const courseStats = coursesWithUserData.map((course) => {
          const views = course.user_courses ? course.user_courses.filter((uc) => uc.attended).length : 0
          const completions = course.user_courses ? course.user_courses.filter((uc) => uc.completed_video).length : 0

          return {
            title: course.title,
            views,
            completions,
          }
        })

        // Calculate total views and completions
        let totalViews = 0
        let totalCompletions = 0
        let mostViewedTitle = ""
        let mostViewedCount = 0

        courseStats.forEach((course) => {
          totalViews += course.views
          totalCompletions += course.completions

          if (course.views > mostViewedCount) {
            mostViewedCount = course.views
            mostViewedTitle = course.title
          }
        })

        // Calculate completion rate
        const completionRate = totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0

        videoStats = {
          totalViews,
          completionRate,
          mostViewedTitle,
          mostViewedCount,
        }
      }

      // Process subscription data
      const subscriptionCounts = {}
      const subscriptionRevenue = {}
      let totalRevenue = 0

      if (subscriptions && subscriptions.length > 0) {
        subscriptions.forEach((sub) => {
          const name = sub.subscriptions?.name || "Unknown"
          const price = sub.subscriptions?.price || 0

          subscriptionCounts[name] = (subscriptionCounts[name] || 0) + 1
          subscriptionRevenue[name] = (subscriptionRevenue[name] || 0) + price
          totalRevenue += price
        })
      }

      // Create subscription data for visualization
      const subData = Object.keys(subscriptionCounts).map((name, index) => {
        const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#ec4899"]
        return {
          name,
          count: subscriptionCounts[name],
          revenue: subscriptionRevenue[name],
          color: colors[index % colors.length],
        }
      })

      setSubscriptionData(subData)

      // Calculate subscription stats
      const basicCount = subscriptionCounts["Basic"] || 0
      const premiumCount = subscriptionCounts["Premium"] || 0
      const proCount = subscriptionCounts["Pro"] || 0
      const totalSubs = basicCount + premiumCount + proCount

      // Get monthly growth data
      const { data: monthlyData, error: monthlyError } = await supabase
        .from("user_subscriptions")
        .select("created_at")
        .gte("created_at", new Date(new Date().setMonth(new Date().getMonth() - 5)).toISOString())
        .order("created_at", { ascending: true })

      if (monthlyError) {
        console.error("Error fetching monthly data:", monthlyError)
        newErrors.push(`Error fetching monthly data: ${monthlyError.message}`)
      }

      // Process monthly growth data
      const monthCounts = {}
      const months = ["Jan", "Feb", "Mar", "Apr", "May"]

      // Initialize with zeros
      months.forEach((month) => {
        monthCounts[month] = 0
      })

      // Count subscriptions by month
      if (monthlyData) {
        monthlyData.forEach((item) => {
          if (item.created_at) {
            const date = new Date(item.created_at)
            const month = date.toLocaleString("default", { month: "short" })
            monthCounts[month] = (monthCounts[month] || 0) + 1
          }
        })
      }

      // Calculate percentages
      const total = Object.values(monthCounts).reduce((sum, count) => sum + count, 0)
      const growthData = months.map((month) => ({
        month,
        count: monthCounts[month] || 0,
        percentage: total > 0 ? ((monthCounts[month] || 0) / total) * 100 : 0,
      }))

      setMonthlyGrowth(growthData)
      setTableInfo(tableColumns)

      // Update all stats
      setStats({
        totalUsers: userCount || 0,
        totalCourses: courseCount || 0,
        totalNotifications: notificationCount || 0,
        upcomingCourses: upcomingCount || 0,
        subscriptionStats: {
          basic: basicCount,
          premium: premiumCount,
          pro: proCount,
          total: totalSubs,
        },
        revenueStats: {
          monthly: totalRevenue,
          quarterly: totalRevenue * 3,
          annual: totalRevenue * 12,
        },
        videoStats,
      })

      console.log("Dashboard data loaded:", {
        users: userCount,
        courses: courseCount,
        notifications: notificationCount,
        subscriptions: totalSubs,
        videoStats,
      })

      if (newErrors.length > 0) {
        setErrors(newErrors)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setErrors([`General error: ${error.message}`])
    } finally {
      setLoading(false)
    }
  }

  // Navigation items for mobile menu
  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "grid" },
    { href: "/admin/courses", label: "Courses", icon: "book-open" },
    { href: "/admin/users", label: "Users", icon: "users" },
    { href: "/admin/subscriptions", label: "Subscriptions", icon: "credit-card" },
    { href: "/admin/notifications", label: "Notifications", icon: "bell" },
    { href: "/admin/documents", label: "Documents", icon: "file-text" },
    { href: "/admin/analytics/video", label: "Analytics", icon: "bar-chart" },
    { href: "/admin/updates", label: "Updates", icon: "refresh-cw" },
    { href: "/admin/contact", label: "Contact", icon: "mail" },
    { href: "/admin/email", label: "Send Email", icon: "send" },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>

          {/* Mobile hamburger menu - only visible on mobile */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile navigation menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white rounded-lg shadow-md p-4 mb-6">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center p-2 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      {item.icon === "grid" && (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 009-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      )}
                      {item.icon === "book-open" && (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      )}
                      {item.icon === "users" && (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      )}
                      {item.icon === "credit-card" && (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 0v5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h2a2 2 0 012-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      )}
                      {item.icon === "bell" && (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      )}
                      {item.icon === "file-text" && (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      )}
                      {item.icon === "bar-chart" && (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      )}
                      {item.icon === "refresh-cw" && (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      )}
                      {item.icon === "mail" && (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      )}
                      {item.icon === "send" && (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      )}
                    </svg>
                  </span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Error display */}
        {errors.length > 0 && (
          <Card className="border-2 border-red-500 mb-4">
            <CardContent className="p-4">
              <h3 className="font-bold text-red-600 mb-2">Errors:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-600">
                    {error}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Debug information */}
        <Card className="border-2 border-blue-300 mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col">
              <h3 className="font-bold mb-2">Debug Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Users: {stats.totalUsers}</div>
                <div>Courses: {stats.totalCourses}</div>
                <div>Notifications: {stats.totalNotifications}</div>
                <div>Video Views: {stats.videoStats.totalViews}</div>
                <div>Subscriptions: {stats.subscriptionStats.total}</div>
              </div>
              {Object.keys(tableInfo).length > 0 && (
                <div className="mt-2">
                  <h4 className="font-semibold">Table Columns:</h4>
                  {Object.entries(tableInfo).map(([table, columns]) => (
                    <div key={table} className="mt-1">
                      <span className="font-medium">{table}:</span> {columns.join(", ")}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2">
                <Button
                  onClick={() => {
                    console.log("Current stats:", stats)
                    fetchDashboardData()
                  }}
                  size="sm"
                  variant="outline"
                >
                  Force Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0 md:mr-6">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Admin Dashboard</h2>
              <p className="text-white text-opacity-90 mb-4">
                Manage your courses, users, and more from this central dashboard.
              </p>
              <Button onClick={fetchDashboardData} className="bg-white text-blue-600 hover:bg-blue-50">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Dashboard Data
              </Button>
            </div>
            <div className="w-32 h-32 rounded-full overflow-hidden bg-white bg-opacity-20 flex items-center justify-center">
              <img src="/images/yoga-pose-bg.jpg" alt="Yoga Pose" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Main stats cards in a single row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Users Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "Loading..." : stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users in the system</p>
            </CardContent>
          </Card>

          {/* Total Courses Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "Loading..." : stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">Courses created in the system</p>
            </CardContent>
          </Card>

          {/* Classes Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes</CardTitle>
              <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "Loading..." : stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">Active classes in the system</p>
            </CardContent>
          </Card>

          {/* Notifications Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "Loading..." : stats.totalNotifications}</div>
              <p className="text-xs text-muted-foreground">Notifications sent to users</p>
            </CardContent>
          </Card>
        </div>

        {/* Video Analytics Overview - All cards in a single line */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Video Analytics Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Total Views</h3>
                  <p className="text-2xl font-bold">{loading ? "..." : stats.videoStats.totalViews.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">Across all videos</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Completion Rate</h3>
                  <p className="text-2xl font-bold">
                    {loading ? "..." : `${stats.videoStats.completionRate.toFixed(1)}%`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Average across all videos</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Most Viewed</h3>
                  <p className="text-lg font-medium">
                    {loading ? "..." : stats.videoStats.mostViewedTitle || "No data"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {loading ? "..." : `${stats.videoStats.mostViewedCount} views`}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button asChild>
                  <Link href="/admin/analytics/video">View Detailed Analytics</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Analytics Section with Detailed Analysis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Subscription Analytics</CardTitle>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Top level metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Active Subscriptions</h3>
                  <p className="text-2xl font-bold">{loading ? "..." : stats.subscriptionStats.total}</p>
                  <p className="text-sm text-gray-500 mt-1">Currently active</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Monthly Revenue</h3>
                  <p className="text-2xl font-bold">₹{loading ? "..." : stats.revenueStats.monthly.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Annual Projection</h3>
                  <p className="text-2xl font-bold">₹{loading ? "..." : stats.revenueStats.annual.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">Based on current subscriptions</p>
                </div>
              </div>

              {/* Subscription distribution */}
              <div>
                <h3 className="font-medium text-gray-700 mb-3">Subscription Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Subscription counts */}
                  <div>
                    <div className="space-y-3">
                      {subscriptionData.length > 0 ? (
                        subscriptionData.map((sub, index) => (
                          <div key={index} className="flex items-center">
                            <span className="text-sm w-24">{sub.name}</span>
                            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full"
                                style={{
                                  width: `${(sub.count / stats.subscriptionStats.total) * 100}%`,
                                  backgroundColor: sub.color,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm ml-2 w-12 text-right">{sub.count}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No subscription data available</p>
                      )}
                    </div>
                  </div>

                  {/* Revenue breakdown */}
                  <div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">Revenue Breakdown</h4>
                      {subscriptionData.length > 0 ? (
                        <div className="space-y-2">
                          {subscriptionData.map((sub, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: sub.color }}></div>
                                <span>{sub.name}</span>
                              </div>
                              <span>₹{sub.revenue.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No revenue data available</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subscription growth chart */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Subscription Growth</h3>
                  <div className="h-12 bg-gray-100 rounded-md overflow-hidden">
                    <div className="flex h-full">
                      {monthlyGrowth.map((month, index) => (
                        <div
                          key={index}
                          className="h-full"
                          style={{
                            width: `${month.percentage}%`,
                            backgroundColor: `hsl(142, ${70 - index * 10}%, ${40 + index * 5}%)`,
                          }}
                          title={`${month.month}: ${month.count} subscriptions`}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    {monthlyGrowth.map((month, index) => (
                      <span key={index}>{month.month}</span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button asChild variant="outline">
                    <Link href="/admin/subscriptions">Manage Subscriptions</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
