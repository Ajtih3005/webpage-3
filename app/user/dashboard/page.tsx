"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { UserLayout } from "@/components/user-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { Bell, Calendar, PlayCircle, AlertTriangle } from "lucide-react"

interface Notification {
  id: number
  message: string
  created_at: string
}

interface AttendanceData {
  total: number
  attended: number
  percentage: number
}

export default function UserDashboard() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [attendance, setAttendance] = useState<AttendanceData>({
    total: 0,
    attended: 0,
    percentage: 0,
  })
  const [loading, setLoading] = useState(true)
  const [authStatus, setAuthStatus] = useState<string>("")

  useEffect(() => {
    // Check authentication status
    const userId = localStorage.getItem("userId")
    const userAuth = localStorage.getItem("userAuthenticated")
    setAuthStatus(userAuth === "true" ? `Authenticated (User ID: ${userId})` : "Not authenticated")

    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)

      const userId = localStorage.getItem("userId")
      if (!userId) {
        throw new Error("User ID not found")
      }

      const supabase = getSupabaseBrowserClient()

      // Fetch recent notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      if (notificationsError) throw notificationsError

      setNotifications(notificationsData || [])

      // Fetch attendance data
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("user_courses")
        .select("*")
        .eq("user_id", userId)

      if (attendanceError) throw attendanceError

      const total = attendanceData?.length || 0
      const attended = attendanceData?.filter((record) => record.attended)?.length || 0
      const percentage = total > 0 ? Math.round((attended / total) * 100) : 0

      setAttendance({
        total,
        attended,
        percentage,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Emergency login function
  const forceLogin = () => {
    localStorage.setItem("userAuthenticated", "true")
    if (!localStorage.getItem("userId")) {
      localStorage.setItem("userId", "1")
      localStorage.setItem("userName", "Test User")
    }
    window.location.reload()
  }

  return (
    <>
      {/* Emergency login button - only visible if not in UserLayout */}
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

      <UserLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>

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

          {/* Access Course Button */}
          <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <PlayCircle className="h-16 w-16 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Ready for Your Yoga Session?</h2>
              <p className="mb-6">Access today's courses and start your wellness journey</p>
              <Button
                size="lg"
                variant="secondary"
                className="font-bold"
                onClick={() => router.push("/user/access-course")}
              >
                Access Course
              </Button>
            </CardContent>
          </Card>

          {/* Stats Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Attendance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Attendance
                </CardTitle>
                <CardDescription>Your course attendance statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading attendance data...</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Attendance Rate</span>
                      <span className="font-bold">{attendance.percentage}%</span>
                    </div>
                    <Progress value={attendance.percentage} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      You've attended {attendance.attended} out of {attendance.total} sessions.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notifications Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Recent Notifications
                </CardTitle>
                <CardDescription>Latest updates and announcements</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading notifications...</p>
                ) : notifications.length === 0 ? (
                  <p className="text-muted-foreground">No notifications yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {notifications.slice(0, 3).map((notification) => (
                      <li key={notification.id} className="border-b pb-2 last:border-0">
                        <p>{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(notification.created_at)}</p>
                      </li>
                    ))}
                    {notifications.length > 3 && (
                      <li className="text-center">
                        <Button variant="link" onClick={() => router.push("/user/notifications")}>
                          View all notifications
                        </Button>
                      </li>
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </UserLayout>
    </>
  )
}
