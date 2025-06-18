"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, Search, Trash2, ChevronDown, ChevronRight, SortAsc, Eye } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate, getBatchLabel } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

interface Course {
  id: number
  title: string
  description: string
  youtube_link: string
  scheduled_date: string
  language: string
  created_at: string
  scheduling_type: string
  subscription_day: number | null
  subscription_week: number | null
  batches: {
    id: number
    batch_number: string | null
    custom_batch_time: string | null
    is_predefined_batch: boolean
    subscription_id: number | null
    subscription_name: string | null
  }[]
}

type SortOption = "date" | "title" | "subscription" | "language"

export default function ManageCourses() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({})
  const [sortOption, setSortOption] = useState<SortOption>("date")

  useEffect(() => {
    fetchCourses()
  }, [])

  async function fetchCourses() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      // Fetch courses with their batches using the new structure
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .order("scheduled_date", { ascending: false })

      if (coursesError) throw coursesError

      // Fetch batches for all courses
      const { data: batchesData, error: batchesError } = await supabase.from("course_batches").select(`
          *,
          subscriptions (
            name
          )
        `)

      if (batchesError) throw batchesError

      // Combine courses with their batches
      const coursesWithBatches =
        coursesData?.map((course) => ({
          ...course,
          batches:
            batchesData
              ?.filter((batch) => batch.course_id === course.id)
              .map((batch) => ({
                id: batch.id,
                batch_number: batch.batch_number,
                custom_batch_time: batch.custom_batch_time,
                is_predefined_batch: batch.is_predefined_batch,
                subscription_id: batch.subscription_id,
                subscription_name: batch.subscriptions?.name || null,
              })) || [],
        })) || []

      setCourses(coursesWithBatches)

      // Initialize all groups as open
      const initialOpenState = {}
      coursesWithBatches.forEach((course) => {
        initialOpenState[course.id] = true
      })
      setOpenGroups(initialOpenState)
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setLoading(false)
    }
  }

  // Sort courses based on the selected sort option
  const sortCourses = (courses: Course[]): Course[] => {
    return [...courses].sort((a, b) => {
      switch (sortOption) {
        case "date":
          return new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        case "language":
          return a.language.localeCompare(b.language)
        case "subscription":
          // Count paid batches (with subscription_id) in each course
          const aPaidBatches = a.batches.filter((batch) => batch.subscription_id !== null).length
          const bPaidBatches = b.batches.filter((batch) => batch.subscription_id !== null).length

          // Sort by number of paid batches (descending)
          if (aPaidBatches !== bPaidBatches) {
            return bPaidBatches - aPaidBatches
          }

          // If tied on subscription, sort by date (newest first)
          return new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
        default:
          return 0
      }
    })
  }

  const filteredCourses = sortCourses(
    courses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase())),
    ),
  )

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm("Are you sure you want to delete this course? This will also delete all associated batches.")) return

    try {
      const supabase = getSupabaseBrowserClient()

      // Delete the course (batches will be deleted automatically due to CASCADE)
      const { error } = await supabase.from("courses").delete().eq("id", courseId)

      if (error) throw error

      // Refresh the courses list
      fetchCourses()
    } catch (error) {
      console.error("Error deleting course:", error)
    }
  }

  const handleDeleteBatch = async (batchId: number) => {
    if (!confirm("Are you sure you want to delete this batch?")) return

    try {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase.from("course_batches").delete().eq("id", batchId)

      if (error) throw error

      // Refresh the courses list
      fetchCourses()
    } catch (error) {
      console.error("Error deleting batch:", error)
    }
  }

  const toggleGroup = (courseId: number) => {
    setOpenGroups((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }))
  }

  const getSortLabel = (option: SortOption): string => {
    switch (option) {
      case "date":
        return "Date (Newest)"
      case "title":
        return "Title"
      case "language":
        return "Language"
      case "subscription":
        return "Subscription"
      default:
        return "Sort"
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Courses</h1>
          <Button onClick={() => router.push("/admin/courses/create")}>
            <Plus className="mr-2 h-4 w-4" /> Add Course
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Course List</CardTitle>
            <CardDescription>View, edit, and delete courses and their batch timeslots</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-2">
                    <SortAsc className="mr-2 h-4 w-4" />
                    Sort by: {getSortLabel(sortOption)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortOption("date")}>Date (Newest)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("title")}>Title</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("language")}>Language</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("subscription")}>Subscription</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {loading ? (
              <div className="text-center py-4">Loading courses...</div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-4">
                {searchQuery ? "No courses match your search." : "No courses found. Create your first course!"}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Details</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Batches</TableHead>
                      <TableHead>Scheduling</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((course) => {
                      const isOpen = openGroups[course.id]
                      const paidBatches = course.batches.filter((batch) => batch.subscription_id !== null).length
                      const totalBatches = course.batches.length

                      return (
                        <>
                          <TableRow
                            key={`course-${course.id}`}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleGroup(course.id)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                {isOpen ? (
                                  <ChevronDown className="h-4 w-4 mr-2" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 mr-2" />
                                )}
                                <div>
                                  <div className="font-semibold">{course.title}</div>
                                  {course.description && (
                                    <div className="text-sm text-gray-500 mt-1">{course.description}</div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(course.scheduled_date)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{course.language}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span className="mr-2">
                                  {totalBatches} batch{totalBatches !== 1 ? "es" : ""}
                                  {paidBatches > 0 && (
                                    <span className="ml-1 text-xs text-gray-500">({paidBatches} paid)</span>
                                  )}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {course.scheduling_type === "date" && (
                                <span>Date: {format(new Date(course.scheduled_date), "MMM d, yyyy")}</span>
                              )}
                              {course.scheduling_type === "day" && (
                                <span>Day {course.subscription_day} of subscription</span>
                              )}
                              {course.scheduling_type === "week" && (
                                <span>Week {course.subscription_week} of subscription</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/admin/courses/view/${course.id}`)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" /> View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteCourse(course.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Render batch rows only if the group is open */}
                          {isOpen &&
                            course.batches.map((batch) => (
                              <TableRow key={`batch-${batch.id}`} className="bg-gray-50">
                                <TableCell className="pl-12">
                                  <span className="text-gray-500">Batch:</span>
                                </TableCell>
                                <TableCell>
                                  {batch.is_predefined_batch && batch.batch_number ? (
                                    <Badge variant="outline">{getBatchLabel(batch.batch_number)}</Badge>
                                  ) : (
                                    <span>{batch.custom_batch_time}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {batch.subscription_id ? (
                                    <Badge className="cursor-help" title={`Subscription ID: ${batch.subscription_id}`}>
                                      {batch.subscription_name || "Paid Access"}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">Free Access</Badge>
                                  )}
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/admin/courses/edit-batch/${batch.id}`)
                                      }}
                                    >
                                      <Pencil className="h-4 w-4 mr-1" /> Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteBatch(batch.id)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
