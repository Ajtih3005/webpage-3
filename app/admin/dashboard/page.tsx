"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Bell, Calendar, AlertTriangle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

interface DashboardStats {
  totalUsers: number
  totalCourses: number
  totalNotifications: number
  upcomingCourses: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalNotifications: 0,
    upcomingCourses: 0,
  })
  const [loading, setLoading] = useState(true)
  const [authStatus, setAuthStatus] = useState<string>("")

  useEffect(() => {
    // Check authentication status
    const adminAuth = localStorage.getItem("adminAuthenticated")
    setAuthStatus(adminAuth === "true" ? "Authenticated" : "Not authenticated")

    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      // Get total users
      const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true })

      // Get total courses
      const { count: courseCount } = await supabase.from("courses").select("*", { count: "exact", head: true })

      // Get total notifications
      const { count: notificationCount } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })

      // Get upcoming courses (scheduled for today or later)
      const today = new Date().toISOString().split("T")[0]
      const { count: upcomingCount } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .gte("scheduled_date", today)

      setStats({
        totalUsers: userCount || 0,
        totalCourses: courseCount || 0,
        totalNotifications: notificationCount || 0,
        upcomingCourses: upcomingCount || 0,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Emergency login function
  const forceLogin = () => {
    localStorage.setItem("adminAuthenticated", "true")
    window.location.reload()
  }

  return (
    <>
      {/* Emergency login button - only visible if not in AdminLayout */}
      {!authStatus.includes("Authenticated") && (
        <div className="fixed top-0 left-0 w-full bg-red-500 text-white p-4 z-50 flex justify-between items-center">
          <div className="flex items-center">
            <AlertTriangle className="mr-2" />
            <span>Authentication issue detected</span>
          </div>
          <Button onClick={forceLogin} variant="secondary">
            Force Login
          </Button>
        </div>
      )}

      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>

          {/* Auth status indicator for debugging */}
          <Card className="border-2 border-green-500 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Auth Status: {authStatus}</p>
                  <p className="text-sm text-gray-500">If you're seeing this, you're successfully logged in!</p>
                </div>
                <Button onClick={() => window.location.reload()} size="sm">
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

            {/* Upcoming Courses Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Courses</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "Loading..." : stats.upcomingCourses}</div>
                <p className="text-xs text-muted-foreground">Courses scheduled for today or later</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading recent users...</p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {stats.totalUsers === 0
                        ? "No users registered yet."
                        : "View all users in the Manage Users section."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Courses</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading recent courses...</p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {stats.totalCourses === 0
                        ? "No courses created yet."
                        : "View all courses in the Manage Courses section."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </>
  )
}
