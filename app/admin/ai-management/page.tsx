"use client"

import { useState, useEffect } from "react"
import { getAISessions, getAIStats } from "@/app/actions/ai-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, TrendingUp, Users, Activity, Settings, BarChart3, AlertCircle, ArrowLeft } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface AISession {
  id: number
  user_email: string
  course_id: number
  activity_type: string
  overall_score: number
  total_duration: number
  session_start_time: string
}

interface AIStats {
  totalSessions: number
  averageScore: number
  totalUsers: number
  popularActivity: string
}

export default function AIManagementPage() {
  const [aiSessions, setAiSessions] = useState<AISession[]>([])
  const [aiStats, setAiStats] = useState<AIStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("7")
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    fetchAIData()
  }, [selectedActivity, dateRange])

  const fetchAIData = async () => {
    try {
      setLoading(true)
      setConnectionError(null)

      const daysAgo = Number.parseInt(dateRange)

      const [sessionsResult, statsResult] = await Promise.all([
        getAISessions(selectedActivity, daysAgo),
        getAIStats(daysAgo),
      ])

      if (!sessionsResult.success) {
        throw new Error(sessionsResult.error)
      }

      if (!statsResult.success) {
        throw new Error(statsResult.error)
      }

      setAiSessions(sessionsResult.sessions)
      setAiStats(statsResult.stats)
    } catch (error: any) {
      console.error("[v0] Error fetching AI data:", error)
      setConnectionError(error.message || "Failed to connect to AI database")
      toast({
        title: "Error",
        description: "Failed to load AI analysis data. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportAIData = async () => {
    try {
      const csvContent = [
        ["Session ID", "User Email", "Course ID", "Activity Type", "Score", "Duration (min)", "Date"].join(","),
        ...aiSessions.map((session) =>
          [
            session.id,
            session.user_email || "N/A",
            session.course_id || "N/A",
            session.activity_type,
            session.overall_score || 0,
            Math.round((session.total_duration || 0) / 60),
            new Date(session.session_start_time).toLocaleDateString(),
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ai-analysis-data-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "AI analysis data exported successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (connectionError) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="w-6 h-6" />
              {connectionError}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-yellow-600">Unable to connect to the AI analysis database:</p>
            <div className="bg-white p-4 rounded border border-yellow-200 font-mono text-sm">{connectionError}</div>
            <p className="text-sm text-yellow-600">
              Please ensure the AI database is set up correctly and the SQL schema has been run.
            </p>
            <Button onClick={fetchAIData} className="bg-yellow-600 hover:bg-yellow-700">
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/admin")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="w-8 h-8 text-purple-600" />
              AI Analysis Management
            </h1>
            <p className="text-gray-600 mt-2">Monitor and manage AI-powered yoga analysis sessions</p>
            {/* <p className="text-xs text-gray-500 mt-1">Connected to: {aiSupabaseUrl || "Not configured"}</p> */}
          </div>
        </div>
        <Button onClick={exportAIData} className="bg-purple-600 hover:bg-purple-700">
          Export Data
        </Button>
      </div>

      {/* Statistics Cards */}
      {aiStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aiStats.totalSessions}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aiStats.averageScore}%</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aiStats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Popular Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{aiStats.popularActivity}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sessions">AI Sessions</TabsTrigger>
          <TabsTrigger value="settings">AI Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="activity-filter">Activity Type</Label>
                <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="yoga">Yoga</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="singing">Singing</SelectItem>
                    <SelectItem value="dance">Dance</SelectItem>
                    <SelectItem value="meditation">Meditation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="date-range">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 24 hours</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sessions Table */}
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">User Email</th>
                      <th className="text-left p-2">Course ID</th>
                      <th className="text-left p-2">Activity</th>
                      <th className="text-left p-2">Score</th>
                      <th className="text-left p-2">Duration</th>
                      <th className="text-left p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiSessions.map((session) => (
                      <tr key={session.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{session.user_email || "N/A"}</td>
                        <td className="p-2">{session.course_id || "N/A"}</td>
                        <td className="p-2 capitalize">{session.activity_type}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              (session.overall_score || 0) >= 80
                                ? "bg-green-100 text-green-800"
                                : (session.overall_score || 0) >= 60
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {session.overall_score || 0}%
                          </span>
                        </td>
                        <td className="p-2">{Math.round((session.total_duration || 0) / 60)}m</td>
                        <td className="p-2">{new Date(session.session_start_time).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {aiSessions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No AI analysis sessions found for the selected filters.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                AI Analysis Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="analysis-frequency">Analysis Frequency (seconds)</Label>
                <Input id="analysis-frequency" type="number" defaultValue="2" min="1" max="10" className="mt-1" />
                <p className="text-sm text-gray-600 mt-1">How often to analyze poses during sessions</p>
              </div>

              <div>
                <Label htmlFor="min-confidence">Minimum Confidence Threshold</Label>
                <Input
                  id="min-confidence"
                  type="number"
                  defaultValue="0.5"
                  min="0.1"
                  max="1"
                  step="0.1"
                  className="mt-1"
                />
                <p className="text-sm text-gray-600 mt-1">Minimum confidence level for pose detection</p>
              </div>

              <div>
                <Label htmlFor="feedback-sensitivity">Feedback Sensitivity</Label>
                <Select defaultValue="medium">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Less frequent feedback</SelectItem>
                    <SelectItem value="medium">Medium - Balanced feedback</SelectItem>
                    <SelectItem value="high">High - More frequent feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full bg-purple-600 hover:bg-purple-700">Save AI Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
