"use client"

import { useEffect, useState, useRef } from "react"
import { UserLayout } from "@/components/user-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate, getBatchLabel } from "@/lib/utils"
import {
  Calendar,
  CheckCircle,
  Clock,
  Play,
  AlertCircle,
  Home,
  BookOpen,
  Maximize,
  Minimize,
  Globe,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

// Add these imports at the top
import { SubscriptionSelector } from "@/components/subscription-selector"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface Batch {
  id: number
  batch_number: string | null
  custom_batch_time: string | null
  is_predefined_batch: boolean
}

interface Course {
  id: number
  title: string
  description: string | null
  youtube_link: string
  scheduled_date: string
  language: string
  subscription_id: number | null
  attended: boolean
  completedVideo: boolean
  videoDuration?: number // in seconds
  batches: Batch[] // Array of batch information
}

interface GroupedCourse {
  title: string
  description: string | null
  youtube_link: string
  scheduled_date: string
  language: string
  subscription_id: number | null
  batches: Batch[]
  attended: boolean
  completedVideo: boolean
  videoDuration?: number
  eligibleSubscriptions: any[]
}

export default function AccessCourse() {
  const [todayCourses, setTodayCourses] = useState<Course[]>([])
  const [groupedTodayCourses, setGroupedTodayCourses] = useState<GroupedCourse[]>([])
  const [upcomingCourses, setUpcomingCourses] = useState<Course[]>([])
  const [groupedUpcomingCourses, setGroupedUpcomingCourses] = useState<GroupedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<GroupedCourse | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [accessError, setAccessError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null)
  const [hasCompletedVideo, setHasCompletedVideo] = useState(false)
  const [videoContainerRef, setVideoContainerRef] = useState<HTMLDivElement | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English")
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(["English"])
  const [waitingForAccess, setWaitingForAccess] = useState(false)
  const [waitingCountdown, setWaitingCountdown] = useState(10)
  const [timeUntilSession, setTimeUntilSession] = useState<string | null>(null)
  const [sessionCountdown, setSessionCountdown] = useState<number | null>(null)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  const [sessionInProgress, setSessionInProgress] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [lateJoin, setLateJoin] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [markingAttendance, setMarkingAttendance] = useState(false)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const [userDbId, setUserDbId] = useState<number | null>(null)
  const [youtubeEmbedUrl, setYoutubeEmbedUrl] = useState<string>("")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const countdownInterval = useRef<NodeJS.Timeout | null>(null)
  const sessionInterval = useRef<NodeJS.Timeout | null>(null)
  const videoTimer = useRef<NodeJS.Timeout | null>(null)
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const startVideoTimeout = useRef<NodeJS.Timeout | null>(null)

  // Add these state variables to the component
  const [showSubscriptionSelector, setShowSubscriptionSelector] = useState(false)
  const [eligibleSubscriptions, setEligibleSubscriptions] = useState<any[]>([])
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null)

  useEffect(() => {
    fetchUserData()
    fetchCourses()

    // Cleanup intervals on unmount
    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current)
      if (sessionInterval.current) clearInterval(sessionInterval.current)
      if (videoTimer.current) clearInterval(videoTimer.current)
      if (sessionCheckInterval.current) clearInterval(sessionCheckInterval.current)
      if (startVideoTimeout.current) clearTimeout(startVideoTimeout.current)
    }
  }, [])

  // Fetch user data including database ID
  async function fetchUserData() {
    try {
      const supabase = getSupabaseBrowserClient()

      // Get auth user ID from localStorage
      const authUserId = localStorage.getItem("userId")
      if (!authUserId) {
        console.error("User ID not found in localStorage")
        setAttendanceError("User ID not found. Please log in again.")
        return
      }

      console.log("Fetching user data for auth ID:", authUserId)

      // Get user's database ID
      const { data, error } = await supabase.from("users").select("id, email").eq("auth_id", authUserId).limit(1)

      if (error) {
        console.error("Error fetching user data:", error)
        setAttendanceError("Error fetching user data. Please try again.")
        return
      }

      if (data && data.length > 0) {
        setUserDbId(data[0].id)
        console.log("User DB ID set:", data[0].id)
      } else {
        console.log("User not found in database with auth_id. Trying user_id field...")

        // Try with user_id field instead
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, email")
          .eq("user_id", authUserId)
          .limit(1)

        if (userError) {
          console.error("Error in second user fetch attempt:", userError)
          setAttendanceError("Error fetching user data. Please try again.")
          return
        }

        if (userData && userData.length > 0) {
          setUserDbId(userData[0].id)
          console.log("User DB ID set from user_id field:", userData[0].id)
        } else {
          // As a fallback, use the auth user ID directly
          console.log("Using auth user ID as fallback:", authUserId)
          setUserDbId(Number.parseInt(authUserId, 10) || null)

          if (isNaN(Number.parseInt(authUserId, 10))) {
            console.error("Auth user ID is not a valid number for fallback")
            setAttendanceError("User not found in database. Please contact support.")
          }
        }
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error)
      setAttendanceError("An unexpected error occurred. Please try again.")
    }
  }

  // Effect for language filter
  useEffect(() => {
    if (selectedLanguage && groupedTodayCourses.length > 0) {
      // Find courses in the selected language
      const coursesInLanguage = groupedTodayCourses.filter((course) => course.language === selectedLanguage)

      if (coursesInLanguage.length > 0) {
        setSelectedCourse(coursesInLanguage[0])
        if (coursesInLanguage[0].batches.length > 0) {
          setSelectedBatch(coursesInLanguage[0].batches[0])
        }
      }
    }
  }, [selectedLanguage, groupedTodayCourses])

  // Effect for waiting countdown
  useEffect(() => {
    if (waitingForAccess && waitingCountdown > 0) {
      countdownInterval.current = setInterval(() => {
        setWaitingCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current!)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (countdownInterval.current) clearInterval(countdownInterval.current)
      }
    } else if (waitingForAccess && waitingCountdown === 0 && selectedCourse && selectedBatch) {
      // When countdown reaches zero, start the video
      console.log("Waiting countdown reached zero, starting video...")
      startVideo()
    }
  }, [waitingForAccess, waitingCountdown, selectedCourse, selectedBatch])

  // Effect for session countdown
  useEffect(() => {
    if (sessionCountdown !== null) {
      sessionInterval.current = setInterval(() => {
        setSessionCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(sessionInterval.current!)
            // When countdown reaches zero, check if we should start the session
            checkAndStartSession()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (sessionInterval.current) clearInterval(sessionInterval.current)
      }
    }
  }, [sessionCountdown])

  // Effect for remaining time
  useEffect(() => {
    if (isVideoPlaying && remainingTime !== null) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer)
            handleVideoEnd()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isVideoPlaying, remainingTime])

  // Effect to check if session has started
  useEffect(() => {
    if (selectedCourse && selectedBatch && !sessionInProgress) {
      // Start a timer to check if the session should start
      sessionCheckInterval.current = setInterval(() => {
        const { canAccess, isLive, elapsedSeconds } = checkSessionStatus(selectedCourse, selectedBatch)

        if (isLive && !sessionStarted) {
          console.log("Session is now live, elapsed seconds:", elapsedSeconds)
          setSessionStarted(true)
          setLateJoin(elapsedSeconds > 0)
          setElapsedTime(elapsedSeconds)

          // If we're not already waiting or playing, show the access button
          if (!waitingForAccess && !isVideoPlaying) {
            setAccessError(null)
            setTimeUntilSession(null)
            setSessionCountdown(null)
          }
        }
      }, 5000) // Check every 5 seconds

      return () => {
        if (sessionCheckInterval.current) {
          clearInterval(sessionCheckInterval.current)
        }
      }
    }
  }, [selectedCourse, selectedBatch, sessionInProgress, sessionStarted])

  // Group courses by title, date, and language
  const groupCourses = (courses: Course[]): GroupedCourse[] => {
    const grouped: { [key: string]: GroupedCourse } = {}

    courses.forEach((course) => {
      // Create a unique key for each course group
      const key = `${course.title}_${course.scheduled_date}_${course.language}`

      if (!grouped[key]) {
        grouped[key] = {
          title: course.title,
          description: course.description,
          youtube_link: course.youtube_link,
          scheduled_date: course.scheduled_date,
          language: course.language,
          subscription_id: course.subscription_id,
          batches: [],
          attended: course.attended,
          completedVideo: course.completedVideo,
          videoDuration: course.videoDuration,
          eligibleSubscriptions: course.eligibleSubscriptions,
        }
      }

      // Add this batch to the course
      grouped[key].batches.push({
        id: course.id,
        batch_number: course.batch_number,
        custom_batch_time: course.custom_batch_time,
        is_predefined_batch: course.is_predefined_batch,
      })

      // If any batch is attended, mark the course as attended
      if (course.attended) {
        grouped[key].attended = true
      }

      // If any batch is completed, mark the course as completed
      if (course.completedVideo) {
        grouped[key].completedVideo = true
      }
    })

    return Object.values(grouped)
  }

  // Format time in HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return [
      hours > 0 ? hours : null,
      minutes.toString().padStart(hours > 0 ? 2 : 1, "0"),
      secs.toString().padStart(2, "0"),
    ]
      .filter(Boolean)
      .join(":")
  }

  // Parse time string to get hours and minutes
  const parseTimeString = (timeStr: string): { hour: number; minute: number } => {
    // Handle formats like "5:30 to 6:30" or "5:30 AM to 6:30 AM"
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/)
    if (!timeMatch) return { hour: 0, minute: 0 }

    let hour = Number.parseInt(timeMatch[1])
    const minute = Number.parseInt(timeMatch[2])
    const ampm = timeMatch[3]?.toUpperCase()

    // Convert to 24-hour format if needed
    if (ampm === "PM" && hour < 12) hour += 12
    if (ampm === "AM" && hour === 12) hour = 0

    return { hour, minute }
  }

  // Get the scheduled start time for a course batch
  const getScheduledStartTime = (course: GroupedCourse, batch: Batch): Date => {
    const today = new Date(course.scheduled_date)

    let startHour = 0
    let startMinute = 0

    if (batch.is_predefined_batch && batch.batch_number) {
      // Parse predefined batch times
      const batchNum = Number.parseInt(batch.batch_number)
      if (batchNum === 1) {
        startHour = 5
        startMinute = 30 // Morning Batch 1 (5:30 to 6:30)
      } else if (batchNum === 2) {
        startHour = 6
        startMinute = 40 // Morning Batch 2 (6:40 to 7:40)
      } else if (batchNum === 3) {
        startHour = 7
        startMinute = 50 // Morning Batch 3 (7:50 to 8:50)
      } else if (batchNum === 4) {
        startHour = 17
        startMinute = 30 // Evening Batch 4 (5:30 to 6:30)
      } else if (batchNum === 5) {
        startHour = 18
        startMinute = 40 // Evening Batch 5 (6:40 to 7:40)
      } else if (batchNum === 6) {
        startHour = 19
        startMinute = 50 // Evening Batch 6 (7:50 to 8:50)
      }
    } else if (batch.custom_batch_time) {
      // Parse custom batch time
      const { hour, minute } = parseTimeString(batch.custom_batch_time)
      startHour = hour
      startMinute = minute
    }

    today.setHours(startHour, startMinute, 0, 0)
    return today
  }

  // Update the checkSessionStatus function to use local date comparison instead of strict date matching
  const checkSessionStatus = (
    course: GroupedCourse,
    batch: Batch,
  ): { canAccess: boolean; isLive: boolean; elapsedSeconds: number; message: string; timeUntil: number | null } => {
    const now = new Date()
    const userLocalDate = now.toLocaleDateString("en-CA") // Format as YYYY-MM-DD

    // Convert both dates to local date strings for comparison
    const scheduledLocalDate = new Date(course.scheduled_date).toLocaleDateString("en-CA")

    // Allow access if it's the same calendar date in user's local time zone
    if (scheduledLocalDate !== userLocalDate) {
      return {
        canAccess: false,
        isLive: false,
        elapsedSeconds: 0,
        message: `This course is scheduled for ${formatDate(course.scheduled_date)}. Videos are only available on the scheduled date.`,
        timeUntil: null,
      }
    }

    // Get scheduled start time
    const scheduledStart = getScheduledStartTime(course, batch)

    // Calculate video duration (default to 30 minutes if not specified)
    const duration = course.videoDuration || 1800

    // Calculate end time (start time + duration)
    const scheduledEnd = new Date(scheduledStart.getTime() + duration * 1000)

    // Calculate time until session starts (in seconds)
    const timeUntilStart = Math.floor((scheduledStart.getTime() - now.getTime()) / 1000)

    // Calculate elapsed time since session started (in seconds)
    const elapsedSeconds = Math.floor((now.getTime() - scheduledStart.getTime()) / 1000)

    // Check if we're within the session time (with 5 minutes early access)
    const earlyAccessSeconds = 5 * 60 // 5 minutes early access
    const isWithinTimeWindow =
      timeUntilStart <= earlyAccessSeconds && // Can access 5 minutes before
      now < scheduledEnd // Session hasn't ended

    // Check if the session is actually live (has started but not ended)
    const isLive = now >= scheduledStart && now < scheduledEnd

    console.log("Session status check:", {
      now: now.toLocaleTimeString(),
      scheduledStart: scheduledStart.toLocaleTimeString(),
      scheduledEnd: scheduledEnd.toLocaleTimeString(),
      timeUntilStart,
      elapsedSeconds,
      isWithinTimeWindow,
      isLive,
    })

    if (!isWithinTimeWindow) {
      if (timeUntilStart > 0) {
        // Session hasn't started yet
        const hoursUntil = Math.floor(timeUntilStart / 3600)
        const minutesUntil = Math.floor((timeUntilStart % 3600) / 60)

        return {
          canAccess: false,
          isLive: false,
          elapsedSeconds: 0,
          message: `This course will be available at ${scheduledStart.toLocaleTimeString()}. Time remaining: ${hoursUntil}h ${minutesUntil}m`,
          timeUntil: timeUntilStart,
        }
      } else {
        // Session has ended
        return {
          canAccess: false,
          isLive: false,
          elapsedSeconds: 0,
          message: `This course was available from ${scheduledStart.toLocaleTimeString()} to ${scheduledEnd.toLocaleTimeString()}. The session has ended.`,
          timeUntil: null,
        }
      }
    }

    return {
      canAccess: true,
      isLive,
      elapsedSeconds: Math.max(0, elapsedSeconds),
      message: "",
      timeUntil: isLive ? null : Math.max(0, timeUntilStart),
    }
  }

  // Update the fetchCourses function to show all available courses regardless of date or attendance
  async function fetchCourses() {
    try {
      setLoading(true)

      const userId = localStorage.getItem("userId")
      if (!userId) {
        throw new Error("User ID not found")
      }

      const supabase = getSupabaseBrowserClient()

      // Use local date in YYYY-MM-DD format
      const todayLocalDate = new Date().toLocaleDateString("en-CA")

      // Get user's subscriptions to check access - now we get all active subscriptions
      const { data: userSubscriptions, error: subError } = await supabase
        .from("user_subscriptions")
        .select(`
        id, 
        subscription_id, 
        start_date, 
        end_date, 
        is_active,
        subscription:subscriptions (
          id,
          name,
          description
        )
      `)
        .eq("user_id", userId)
        .eq("is_active", true)

      if (subError) throw subError

      // Store all active subscription IDs
      const activeSubscriptionIds = userSubscriptions?.map((sub) => sub.subscription_id) || []

      // Fetch all courses
      const { data: allCourses, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .order("scheduled_date", { ascending: false })

      if (coursesError) throw coursesError

      // Get courses for today based on the user's local date
      const todayData =
        allCourses?.filter((course) => {
          // Convert scheduled date to local date for comparison
          const scheduledLocalDate = new Date(course.scheduled_date).toLocaleDateString("en-CA")
          return scheduledLocalDate === todayLocalDate
        }) || []

      // Get upcoming courses based on the user's local date
      const upcomingData =
        allCourses?.filter((course) => {
          // Convert scheduled date to local date for comparison
          const scheduledLocalDate = new Date(course.scheduled_date).toLocaleDateString("en-CA")
          return scheduledLocalDate > todayLocalDate
        }) || []

      // Fetch user's course attendance records
      const { data: userCourses, error: attendanceError } = await supabase
        .from("user_courses")
        .select("course_id, attended, completed_video")
        .eq("user_id", userId)

      if (attendanceError) throw attendanceError

      const attendanceMap = new Map()
      const completionMap = new Map()
      userCourses?.forEach((record) => {
        attendanceMap.set(record.course_id, record.attended)
        completionMap.set(record.course_id, record.completed_video)
      })

      // Process today's courses
      const processedTodayCourses = todayData?.map((course) => {
        // Check if user has access to this course
        const hasAccess =
          !course.subscription_id || // Free course
          activeSubscriptionIds.includes(course.subscription_id) // User has required subscription

        // For courses with subscription requirements, store which subscriptions give access
        let eligibleSubscriptions = []
        if (course.subscription_id) {
          eligibleSubscriptions =
            userSubscriptions?.filter((sub) => sub.subscription_id === course.subscription_id && sub.is_active) || []
        }

        // Check if user has already marked attendance
        const attended = attendanceMap.has(course.id) ? attendanceMap.get(course.id) : false
        const completedVideo = completionMap.has(course.id) ? completionMap.get(course.id) : false

        // Set default language if not specified
        const language = course.language || "English"

        // Set default video duration (in seconds) - in a real app, you would get this from the video metadata
        const videoDuration = 1800 // 30 minutes by default

        return {
          ...course,
          hasAccess,
          eligibleSubscriptions,
          attended,
          completedVideo,
          language,
          videoDuration,
          batches: [
            {
              id: course.id,
              batch_number: course.batch_number,
              custom_batch_time: course.custom_batch_time,
              is_predefined_batch: course.is_predefined_batch,
            },
          ],
        }
      })

      // Process upcoming courses
      const processedUpcomingCourses = upcomingData?.map((course) => {
        const hasAccess =
          !course.subscription_id || // Free course
          activeSubscriptionIds.includes(course.subscription_id) // User has required subscription

        // For courses with subscription requirements, store which subscriptions give access
        let eligibleSubscriptions = []
        if (course.subscription_id) {
          eligibleSubscriptions =
            userSubscriptions?.filter((sub) => sub.subscription_id === course.subscription_id && sub.is_active) || []
        }

        // Set default language if not specified
        const language = course.language || "English"

        return {
          ...course,
          hasAccess,
          eligibleSubscriptions,
          language,
          batches: [
            {
              id: course.id,
              batch_number: course.batch_number,
              custom_batch_time: course.custom_batch_time,
              is_predefined_batch: course.is_predefined_batch,
            },
          ],
        }
      })

      setTodayCourses(processedTodayCourses || [])
      setUpcomingCourses(processedUpcomingCourses || [])

      // Group courses by title, date, and language
      const groupedToday = groupCourses(processedTodayCourses || [])
      const groupedUpcoming = groupCourses(processedUpcomingCourses || [])

      setGroupedTodayCourses(groupedToday)
      setGroupedUpcomingCourses(groupedUpcoming)

      // Get unique languages from today's courses
      const languages = [...new Set(groupedToday.map((course) => course.language))]
      setAvailableLanguages(languages.length > 0 ? languages : ["English"])

      // Set default language to first available
      if (languages.length > 0) {
        setSelectedLanguage(languages[0])
      }

      // Auto-select the first course if available
      if (groupedToday.length > 0) {
        setSelectedCourse(groupedToday[0])
        if (groupedToday[0].batches.length > 0) {
          setSelectedBatch(groupedToday[0].batches[0])
        }
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setLoading(false)
    }
  }

  // Update the handleRequestAccess function to check for multiple subscriptions
  const handleRequestAccess = () => {
    if (!selectedCourse || !selectedBatch) return

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toLocaleDateString("en-CA")

    // Convert scheduled date to local date for comparison
    const scheduledLocalDate = new Date(selectedCourse.scheduled_date).toLocaleDateString("en-CA")

    // Allow access if it's the same calendar date in user's local time zone
    if (scheduledLocalDate !== today) {
      setAccessError("This course is only available on the scheduled date.")
      return
    }

    // Check if the course is available at the current time
    const { canAccess, isLive, message, timeUntil } = checkSessionStatus(selectedCourse, selectedBatch)

    if (!canAccess) {
      setAccessError(message)
      return
    }

    if (selectedCourse.completedVideo) {
      setAccessError("You have already completed this video session.")
      return
    }

    // Check if this course requires a subscription
    if (selectedCourse.subscription_id) {
      // If the course has eligible subscriptions, check how many
      if (selectedCourse.eligibleSubscriptions && selectedCourse.eligibleSubscriptions.length > 0) {
        if (selectedCourse.eligibleSubscriptions.length === 1) {
          // If only one subscription is eligible, use it automatically
          setSelectedSubscriptionId(selectedCourse.eligibleSubscriptions[0].id)
          continueWithAccess()
        } else {
          // If multiple subscriptions are eligible, show the selector
          setEligibleSubscriptions(selectedCourse.eligibleSubscriptions)
          setShowSubscriptionSelector(true)
          return
        }
      } else {
        setAccessError("You don't have an active subscription that gives access to this course.")
        return
      }
    } else {
      // Free course, continue with access
      continueWithAccess()
    }
  }

  // Add a new function to continue with access after subscription selection
  const continueWithAccess = () => {
    if (!selectedCourse || !selectedBatch) return

    console.log("Continuing with access...")

    // If the session hasn't started yet but we're in the early access window
    const now = new Date()
    const scheduledStart = getScheduledStartTime(selectedCourse, selectedBatch)
    const isEarlyAccess = now < scheduledStart

    // Prepare the YouTube embed URL in advance
    const embedUrl = getYoutubeEmbedUrlWithStartTime(
      selectedCourse.youtube_link,
      lateJoin ? elapsedTime : 0,
      true, // This is a live session
    )
    setYoutubeEmbedUrl(embedUrl)
    console.log("YouTube embed URL set:", embedUrl)

    if (isEarlyAccess) {
      // Show a message that we're waiting for the session to start
      setAccessError(null)
      setWaitingForAccess(true)
      setWaitingCountdown(10)
      console.log("Early access mode, starting countdown:", waitingCountdown)

      // Calculate seconds until the session starts
      const secondsUntilStart = Math.floor((scheduledStart.getTime() - now.getTime()) / 1000)

      // After 10 seconds of preparation, wait until the scheduled time to start the video
      startVideoTimeout.current = setTimeout(() => {
        if (secondsUntilStart <= 0) {
          // If the session has already started, start the video immediately
          startVideo()
        } else {
          // Otherwise, show a countdown until the session starts
          setWaitingForAccess(false)
          setTimeUntilSession(formatTime(secondsUntilStart))
          setSessionCountdown(secondsUntilStart)

          // Set a timeout to start the video at the exact scheduled time
          const startTimeout = setTimeout(() => {
            startVideo()
          }, secondsUntilStart * 1000)

          // Clean up the timeout if the component unmounts
          return () => clearTimeout(startTimeout)
        }
      }, 5000) // 5-second preparation buffer instead of 10
    } else {
      // Start the waiting period (reduced to 5 seconds)
      setWaitingForAccess(true)
      setWaitingCountdown(5)
      setAccessError(null)
      console.log("Session already started, starting 5-second countdown")

      // After 5 seconds, start the video
      startVideoTimeout.current = setTimeout(() => {
        if (selectedCourse && selectedBatch) {
          console.log("Countdown complete, starting video now")
          startVideo()
        }
      }, 5000)
    }
  }

  // Add a new function to continue with access after subscription selection
  const startVideo = () => {
    if (!selectedCourse || !selectedBatch) {
      console.error("Cannot start video: course or batch is null")
      return
    }

    console.log("Starting video playback...")

    // Try to mark attendance when the video starts, but don't block video playback
    try {
      handleMarkAttendance(selectedBatch.id)
    } catch (error) {
      console.error("Error marking attendance, but continuing with video playback:", error)
    }

    // Set the video to playing
    setIsVideoPlaying(true)
    setSessionInProgress(true)
    setWaitingForAccess(false)

    // Set the start time of the session
    setSessionStartTime(new Date())

    // Calculate the end time of the session based on the video duration
    const duration = selectedCourse.videoDuration || 1800 // Default to 30 minutes
    const endTime = new Date(Date.now() + duration * 1000)
    setSessionEndTime(endTime)

    // Set the remaining time
    setRemainingTime(duration)

    // Make sure the YouTube embed URL is set
    if (!youtubeEmbedUrl) {
      const embedUrl = getYoutubeEmbedUrlWithStartTime(
        selectedCourse.youtube_link,
        lateJoin ? elapsedTime : 0,
        true, // This is a live session
      )
      setYoutubeEmbedUrl(embedUrl)
      console.log("YouTube embed URL set in startVideo:", embedUrl)
    }

    console.log("Video playback started successfully")
  }

  const handleVideoEnd = () => {
    if (!selectedCourse || !selectedBatch) return

    // Mark the video as completed
    handleMarkVideoCompleted(selectedBatch.id)

    // Stop the video
    setIsVideoPlaying(false)
    setSessionInProgress(false)
  }

  // Add a handler for subscription selection
  const handleSubscriptionSelect = (subscriptionId: number) => {
    setSelectedSubscriptionId(subscriptionId)
    setShowSubscriptionSelector(false)
    continueWithAccess()
  }

  const handleMarkAttendance = async (courseId: number) => {
    try {
      setMarkingAttendance(true)
      setAttendanceError(null)

      // Get the user ID from localStorage if userDbId is not available
      const userId = userDbId || localStorage.getItem("userId")

      if (!userId) {
        console.error("User ID not available")
        setAttendanceError("User ID not found. Please refresh the page and try again.")
        toast({
          title: "Error",
          description: "User ID not found. Please refresh the page and try again.",
          variant: "destructive",
        })
        return
      }

      const supabase = getSupabaseBrowserClient()
      console.log("Marking attendance for user:", userId, "course:", courseId)

      // Check if record already exists
      const { data: existingRecord, error: checkError } = await supabase
        .from("user_courses")
        .select("id, attended")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle() // Use maybeSingle instead of single to avoid errors

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "no rows returned" error, which is expected if no record exists
        console.error("Error checking attendance:", checkError)
        throw checkError
      }

      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("user_courses")
          .update({
            attended: true,
            attended_at: new Date().toISOString(),
          })
          .eq("id", existingRecord.id)

        if (updateError) throw updateError
      } else {
        // Create new record
        const { error: insertError } = await supabase.from("user_courses").insert([
          {
            user_id: userId,
            course_id: courseId,
            attended: true,
            attended_at: new Date().toISOString(),
          },
        ])

        if (insertError) throw insertError
      }

      // Show success message
      toast({
        title: "Success",
        description: "Attendance marked successfully!",
      })

      // Update local state
      setTodayCourses((prevCourses) =>
        prevCourses.map((course) => (course.id === courseId ? { ...course, attended: true } : course)),
      )

      // Also update the grouped courses
      if (selectedCourse) {
        setSelectedCourse({
          ...selectedCourse,
          attended: true,
        })
      }
    } catch (error) {
      console.error("Error marking attendance:", error)
      setAttendanceError(`Error marking attendance: ${error.message || "Unknown error"}`)
      toast({
        title: "Error",
        description: `Failed to mark attendance: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setMarkingAttendance(false)
    }
  }

  const handleMarkVideoCompleted = async (courseId: number) => {
    try {
      // Get the user ID from localStorage if userDbId is not available
      const userId = userDbId || localStorage.getItem("userId")

      if (!userId) {
        console.error("User ID not available")
        return
      }

      const supabase = getSupabaseBrowserClient()

      // Check if record already exists
      const { data: existingRecord, error: checkError } = await supabase
        .from("user_courses")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle()

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError
      }

      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("user_courses")
          .update({
            completed_video: true,
            completed_at: new Date().toISOString(),
          })
          .eq("id", existingRecord.id)

        if (updateError) throw updateError
      } else {
        // Create new record
        const { error: insertError } = await supabase.from("user_courses").insert([
          {
            user_id: userId,
            course_id: courseId,
            completed_video: true,
            completed_at: new Date().toISOString(),
          },
        ])

        if (insertError) throw insertError
      }

      // Update local state
      setTodayCourses((prevCourses) =>
        prevCourses.map((course) => (course.id === courseId ? { ...course, completedVideo: true } : course)),
      )

      if (selectedCourse) {
        setSelectedCourse({
          ...selectedCourse,
          completedVideo: true,
        })
      }

      setHasCompletedVideo(true)

      toast({
        title: "Success",
        description: "Video completion recorded successfully!",
      })
    } catch (error) {
      console.error("Error marking video completion:", error)
      toast({
        title: "Error",
        description: "Failed to record video completion. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCourseSelect = (course: GroupedCourse) => {
    setSelectedCourse(course)

    // Select the first batch by default
    if (course.batches.length > 0) {
      setSelectedBatch(course.batches[0])
    } else {
      setSelectedBatch(null)
    }

    setAccessError(null)
    setIsVideoPlaying(false)
    setHasCompletedVideo(course.completedVideo || false)
    setWaitingForAccess(false)
    setWaitingCountdown(10)
    setSessionStarted(false)
    setLateJoin(false)
    setElapsedTime(0)
    setSessionInProgress(false)
    setYoutubeEmbedUrl("")

    // Reset video times
    setSessionStartTime(null)
    setSessionEndTime(null)

    // Check if course is available now or calculate time until available
    if (course.batches.length > 0) {
      const batch = course.batches[0]
      const { canAccess, isLive, elapsedSeconds, message, timeUntil } = checkSessionStatus(course, batch)

      if (isLive) {
        setSessionStarted(true)
        setLateJoin(elapsedSeconds > 0)
        setElapsedTime(elapsedSeconds)
        setAccessError(null)
        setTimeUntilSession(null)
        setSessionCountdown(null)
      } else if (!canAccess) {
        setAccessError(message)
        if (timeUntil !== null) {
          setSessionCountdown(timeUntil)
          setTimeUntilSession(formatTime(timeUntil))
        }
      } else {
        setSessionCountdown(null)
        setTimeUntilSession(null)
      }
    }
  }

  const handleBatchSelect = (batch: Batch) => {
    if (!selectedCourse) return

    setSelectedBatch(batch)
    setAccessError(null)
    setIsVideoPlaying(false)
    setWaitingForAccess(false)
    setWaitingCountdown(10)
    setSessionStarted(false)
    setLateJoin(false)
    setElapsedTime(0)
    setSessionInProgress(false)
    setYoutubeEmbedUrl("")

    // Reset video times
    setSessionStartTime(null)
    setSessionEndTime(null)

    // Check if batch is available now or calculate time until available
    const { canAccess, isLive, elapsedSeconds, message, timeUntil } = checkSessionStatus(selectedCourse, batch)

    if (isLive) {
      setSessionStarted(true)
      setLateJoin(elapsedSeconds > 0)
      setElapsedTime(elapsedSeconds)
      setAccessError(null)
      setTimeUntilSession(null)
      setSessionCountdown(null)
    } else if (!canAccess) {
      setAccessError(message)
      if (timeUntil !== null) {
        setSessionCountdown(timeUntil)
        setTimeUntilSession(formatTime(timeUntil))
      }
    } else {
      setSessionCountdown(null)
      setTimeUntilSession(null)
    }
  }

  const checkAndStartSession = () => {
    if (!selectedCourse || !selectedBatch) return

    const { isLive, elapsedSeconds } = checkSessionStatus(selectedCourse, selectedBatch)

    if (isLive) {
      setSessionStarted(true)
      setLateJoin(elapsedSeconds > 0)
      setElapsedTime(elapsedSeconds)
      setAccessError(null)
    }
  }

  // Update the YouTube embed URL function to disable all controls for live sessions
  const getYoutubeEmbedUrlWithStartTime = (youtubeLink: string, startSeconds = 0, isLiveSession = true) => {
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = youtubeLink.match(regExp)

    if (!match || match[2].length !== 11) {
      console.error("Invalid YouTube URL:", youtubeLink)
      return "https://www.youtube.com/embed/dQw4w9WgXcQ" // Fallback to a default video
    }

    const videoId = match[2]
    const baseUrl = `https://www.youtube.com/embed/${videoId}`

    if (isLiveSession) {
      // For live sessions: disable controls but keep it simple to avoid errors
      return `${baseUrl}?start=${Math.floor(startSeconds)}&controls=0&rel=0&showinfo=0&modestbranding=1&autoplay=1`
    } else {
      // For previous sessions: allow basic controls
      return `${baseUrl}?start=${Math.floor(startSeconds)}&controls=1&rel=0&showinfo=0&modestbranding=1`
    }
  }

  // Add a function to render the live indicator and custom controls
  const renderVideoOverlay = (isLive: boolean) => {
    if (!isLive) return null

    return (
      <div className="absolute top-2 left-2 z-10 flex items-center">
        <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center">
          <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
          LIVE
        </div>
      </div>
    )
  }

  const toggleFullscreen = () => {
    if (!videoContainerRef) return

    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (videoContainerRef.requestFullscreen) {
          videoContainerRef.requestFullscreen()
        } else if ((videoContainerRef as any).mozRequestFullScreen) {
          ;(videoContainerRef as any).mozRequestFullScreen()
        } else if ((videoContainerRef as any).webkitRequestFullscreen) {
          ;(videoContainerRef as any).webkitRequestFullscreen()
        } else if ((videoContainerRef as any).msRequestFullscreen) {
          ;(videoContainerRef as any).msRequestFullscreen()
        }
        setIsFullscreen(true)
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          ;(document as any).mozCancelFullScreen()
        } else if ((document as any).webkitExitFullscreen) {
          ;(document as any).webkitExitFullscreen()
        } else if ((document as any).msExitFullscreen) {
          ;(document as any).msExitFullscreen()
        }
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error("Fullscreen error:", err)
    }
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Access Course</h1>

        {attendanceError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{attendanceError}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today">Today's Courses</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Courses</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6 mt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading courses...</p>
              </div>
            ) : groupedTodayCourses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Courses Today</h3>
                  <p className="text-gray-500">There are no scheduled courses for today.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Language selector - only show if there are multiple languages available */}
                {availableLanguages.length > 1 && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium">Language:</span>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLanguages.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 space-y-4">
                    <h2 className="text-lg font-medium">Available Courses</h2>
                    {groupedTodayCourses
                      .filter((course) => course.language === selectedLanguage)
                      .map((course) => (
                        <Card
                          key={`${course.title}_${course.scheduled_date}_${course.language}`}
                          className={`cursor-pointer hover:border-primary transition-colors ${
                            selectedCourse?.title === course.title &&
                            selectedCourse?.scheduled_date === course.scheduled_date &&
                            selectedCourse?.language === course.language
                              ? "border-primary"
                              : ""
                          }`}
                          onClick={() => handleCourseSelect(course)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{course.title}</h3>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>
                                    {course.batches.length} {course.batches.length === 1 ? "batch" : "batches"}{" "}
                                    available
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <Globe className="h-4 w-4 mr-1" />
                                  <span>{course.language}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                {course.attended && <CheckCircle className="h-5 w-5 text-green-500 mb-1" />}
                                {course.completedVideo && <Badge className="bg-green-500">Completed</Badge>}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>

                  <div className="md:col-span-2">
                    {selectedCourse ? (
                      <Card>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{selectedCourse.title}</CardTitle>
                              <CardDescription>
                                {formatDate(selectedCourse.scheduled_date)} • {selectedCourse.batches.length}{" "}
                                {selectedCourse.batches.length === 1 ? "batch" : "batches"}
                              </CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                              {selectedCourse.subscription_id && (
                                <Badge className="bg-primary">Subscription Required</Badge>
                              )}
                              <Badge variant="outline">{selectedCourse.language}</Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {selectedCourse.description && <p>{selectedCourse.description}</p>}

                          {/* Batch selection */}
                          {selectedCourse.batches.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-medium">Available Batches:</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {selectedCourse.batches.map((batch) => (
                                  <div
                                    key={batch.id}
                                    className={`p-2 border rounded-md cursor-pointer hover:border-primary transition-colors ${
                                      selectedBatch?.id === batch.id ? "border-primary bg-primary/5" : ""
                                    }`}
                                    onClick={() => handleBatchSelect(batch)}
                                  >
                                    {batch.is_predefined_batch && batch.batch_number ? (
                                      <span>
                                        Batch {batch.batch_number}: {getBatchLabel(batch.batch_number)}
                                      </span>
                                    ) : (
                                      <span>{batch.custom_batch_time}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Navigation buttons above video */}
                          <div className="flex justify-between mb-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href="/user/dashboard">
                                <Home className="mr-2 h-4 w-4" />
                                Go to Dashboard
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm">
                              <BookOpen className="mr-2 h-4 w-4" />
                              View Course Page
                            </Button>
                          </div>

                          {accessError && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{accessError}</AlertDescription>
                            </Alert>
                          )}

                          {timeUntilSession && (
                            <Alert>
                              <Clock className="h-4 w-4" />
                              <AlertDescription>
                                Time until session starts:{" "}
                                {sessionCountdown !== null ? formatTime(sessionCountdown) : timeUntilSession}
                              </AlertDescription>
                            </Alert>
                          )}

                          {waitingForAccess ? (
                            <div className="aspect-video rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                              <div className="text-center p-6">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                                <h3 className="text-xl font-medium mb-2">Preparing Your Session</h3>
                                <p className="text-gray-500 mb-4">
                                  Your session will begin in {waitingCountdown} seconds...
                                </p>
                              </div>
                            </div>
                          ) : isVideoPlaying && selectedBatch ? (
                            <div className="relative" ref={(el) => setVideoContainerRef(el)}>
                              {/* Custom video controls */}
                              <div className="absolute top-2 right-2 z-10 flex space-x-2">
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="bg-black/50 hover:bg-black/70 text-white"
                                  onClick={toggleFullscreen}
                                >
                                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                                </Button>
                              </div>

                              {/* Live indicator */}
                              <div className="absolute top-2 left-2 z-10 flex items-center">
                                <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center">
                                  <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                                  LIVE
                                </div>
                              </div>

                              <div className="aspect-video rounded-md overflow-hidden bg-gray-100 relative">
                                <iframe
                                  ref={iframeRef}
                                  src={youtubeEmbedUrl}
                                  className="w-full h-full"
                                  title={selectedCourse.title}
                                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen={false}
                                ></iframe>
                              </div>

                              {/* Remaining time indicator */}
                              {remainingTime !== null && (
                                <div className="mt-2 text-sm text-gray-600 flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>Remaining time: {formatTime(remainingTime)}</span>
                                </div>
                              )}

                              {hasCompletedVideo && (
                                <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
                                  <CheckCircle className="h-4 w-4" />
                                  <AlertDescription>
                                    You have completed this video session. Thank you for attending!
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          ) : (
                            <div className="aspect-video rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                              <div className="text-center p-6">
                                <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-medium mb-2">Ready to Start?</h3>
                                <p className="text-gray-500 mb-4">Click the button below to access the live session.</p>
                                {sessionStarted ? (
                                  <Button onClick={handleRequestAccess} disabled={markingAttendance}>
                                    {markingAttendance ? (
                                      <>
                                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></div>
                                        Preparing...
                                      </>
                                    ) : (
                                      <>
                                        <Play className="mr-2 h-4 w-4" />
                                        {lateJoin ? "Join Session in Progress" : "Access Session"}
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <Button disabled={!sessionStarted}>
                                    <Clock className="mr-2 h-4 w-4" />
                                    Waiting for Session to Start
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-4">
                            <div className="flex items-center">
                              <Clock className="h-5 w-5 text-gray-500 mr-2" />
                              <span className="text-sm text-gray-500">
                                {selectedBatch &&
                                  (selectedBatch.is_predefined_batch && selectedBatch.batch_number
                                    ? getBatchLabel(selectedBatch.batch_number)
                                    : selectedBatch.custom_batch_time)}
                              </span>
                            </div>
                            {selectedCourse.attended ? (
                              <Badge className="bg-green-500">Attendance Marked</Badge>
                            ) : (
                              <p className="text-sm text-gray-500">
                                Attendance will be marked automatically when you join the session
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <Play className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-xl font-medium mb-2">No Course Selected</h3>
                          <p className="text-gray-500">Please select a course from the list to view its content.</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6 mt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading upcoming courses...</p>
              </div>
            ) : groupedUpcomingCourses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Upcoming Courses</h3>
                  <p className="text-gray-500">There are no upcoming courses scheduled at this time.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-medium">Upcoming Courses</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {groupedUpcomingCourses.map((course) => (
                    <Card key={`${course.title}_${course.scheduled_date}_${course.language}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle>{course.title}</CardTitle>
                          <div className="flex items-center space-x-2">
                            {course.subscription_id && <Badge className="bg-primary">Subscription Required</Badge>}
                            <Badge variant="outline">{course.language}</Badge>
                          </div>
                        </div>
                        <CardDescription>
                          {formatDate(course.scheduled_date)} • {course.batches.length}{" "}
                          {course.batches.length === 1 ? "batch" : "batches"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {course.description && <p className="mb-4">{course.description}</p>}
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">Available Batches:</h3>
                          <div className="space-y-1">
                            {course.batches.map((batch) => (
                              <div key={batch.id} className="text-sm text-gray-600">
                                •{" "}
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
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      {showSubscriptionSelector && (
        <Dialog open={showSubscriptionSelector} onOpenChange={setShowSubscriptionSelector}>
          <DialogContent className="sm:max-w-md">
            <SubscriptionSelector
              subscriptions={eligibleSubscriptions}
              onSelect={handleSubscriptionSelect}
              onCancel={() => setShowSubscriptionSelector(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </UserLayout>
  )
}
