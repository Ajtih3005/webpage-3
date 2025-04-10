"use client"

import { useEffect, useState } from "react"
import { UserLayout } from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate, getBatchLabel } from "@/lib/utils"
import { PlayCircle, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

interface Course {
  id: number
  title: string
  description: string | null
  youtube_link: string
  scheduled_date: string
  is_predefined_batch: boolean
  batch_number: string | null
  custom_batch_time: string | null
  language: string
}

interface GroupedCourse {
  id: number
  title: string
  description: string | null
  youtube_link: string
  scheduled_date: string
  language: string
  batches: {
    id: number
    is_predefined_batch: boolean
    batch_number: string | null
    custom_batch_time: string | null
  }[]
}

export default function PreviousSessions() {
  const [previousCourses, setPreviousCourses] = useState<Course[]>([])
  const [groupedCourses, setGroupedCourses] = useState<GroupedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchPreviousSessions()
  }, [])

  // Group courses by title, date, and language
  const groupCourses = (courses: Course[]): GroupedCourse[] => {
    const grouped: { [key: string]: GroupedCourse } = {}

    courses.forEach((course) => {
      // Create a unique key for each course group
      const key = `${course.title}_${course.scheduled_date}_${course.language}`

      if (!grouped[key]) {
        grouped[key] = {
          id: course.id, // Use the first course's ID
          title: course.title,
          description: course.description,
          youtube_link: course.youtube_link,
          scheduled_date: course.scheduled_date,
          language: course.language || "English",
          batches: [],
        }
      }

      // Add this batch to the course
      grouped[key].batches.push({
        id: course.id,
        batch_number: course.batch_number,
        custom_batch_time: course.custom_batch_time,
        is_predefined_batch: course.is_predefined_batch,
      })
    })

    return Object.values(grouped)
  }

  async function fetchPreviousSessions() {
    try {
      setLoading(true)

      const userId = localStorage.getItem("userId")
      if (!userId) {
        throw new Error("User ID not found")
      }

      const supabase = getSupabaseBrowserClient()

      // Calculate dates for the previous 2 days
      const today = new Date()
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(today.getDate() - 2)

      // Format dates as YYYY-MM-DD
      const todayFormatted = today.toLocaleDateString("en-CA")
      const twoDaysAgoFormatted = twoDaysAgo.toLocaleDateString("en-CA")

      // Get user's attended courses from the previous 2 days
      const { data: userAttendedCourses, error: attendanceError } = await supabase
        .from("user_courses")
        .select("course_id, attended, completed_video")
        .eq("user_id", userId)
        .eq("attended", true) // Only get courses the user has attended

      if (attendanceError) throw attendanceError

      if (!userAttendedCourses || userAttendedCourses.length === 0) {
        setPreviousCourses([])
        setGroupedCourses([])
        setLoading(false)
        return
      }

      // Get the course IDs the user has attended
      const attendedCourseIds = userAttendedCourses.map((record) => record.course_id)

      // Fetch courses from the previous 2 days that the user has attended
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .in("id", attendedCourseIds)
        .gte("scheduled_date", twoDaysAgoFormatted) // Greater than or equal to 2 days ago
        .lt("scheduled_date", todayFormatted) // Less than today
        .order("scheduled_date", { ascending: false })

      if (error) throw error

      // If no courses found from the previous two days
      if (!data || data.length === 0) {
        setPreviousCourses([])
        setGroupedCourses([])
        setLoading(false)
        return
      }

      setPreviousCourses(data)

      // Group courses by title, date, and language
      const grouped = groupCourses(data)
      setGroupedCourses(grouped)
    } catch (error) {
      console.error("Error fetching previous sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  async function viewPreviousSession(courseId: number) {
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        throw new Error("User ID not found")
      }

      const supabase = getSupabaseBrowserClient()

      // Get course details
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single()

      if (courseError) throw courseError

      // Navigate to a dedicated page for viewing previous sessions
      router.push(`/user/view-session/${courseId}`)
    } catch (error) {
      console.error("Error viewing previous session:", error)
    }
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Previous Sessions</h1>

        <Card>
          <CardHeader>
            <CardTitle>Previous Sessions</CardTitle>
            <CardDescription>View sessions from the previous two days</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading previous sessions...</p>
            ) : groupedCourses.length === 0 ? (
              <p className="text-muted-foreground">No sessions were held in the past two days.</p>
            ) : (
              <div className="space-y-6">
                {groupedCourses.map((course) => (
                  <Card key={`${course.title}_${course.scheduled_date}_${course.language}`} className="overflow-hidden">
                    <CardHeader className="bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{course.title}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(course.scheduled_date)}
                            <Badge variant="outline" className="ml-2">
                              {course.language}
                            </Badge>
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => viewPreviousSession(course.id)}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          View Session
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {course.description && <p className="mb-4 text-sm text-gray-600">{course.description}</p>}

                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-2">Batches:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {course.batches.map((batch) => (
                            <div key={batch.id} className="text-sm text-gray-600 flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-gray-400" />
                              {batch.is_predefined_batch && batch.batch_number
                                ? getBatchLabel(batch.batch_number)
                                : batch.custom_batch_time}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  )
}
