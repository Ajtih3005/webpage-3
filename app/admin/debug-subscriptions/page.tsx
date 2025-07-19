"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Bug, CheckCircle, AlertTriangle, Calendar } from "lucide-react"

interface DebugInfo {
  id: string
  user_id: string
  subscription_name: string
  activation_date: string
  is_active: boolean
  current_days_used: number
  calculated_days_should_be: number
  duration_days: number
  days_difference: number
  is_expired: boolean
  should_be_active: boolean
  activation_date_formatted: string
  today_formatted: string
  raw_time_diff_ms: number
  raw_days_calculation: number
}

interface DebugResponse {
  success: boolean
  today: string
  total_subscriptions: number
  debug_info: DebugInfo[]
  error?: string
}

export default function DebugSubscriptions() {
  const [debugData, setDebugData] = useState<DebugResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDebugData()
  }, [])

  const loadDebugData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/debug-subscription-days")
      const data = await response.json()

      if (data.success) {
        setDebugData(data)
      } else {
        setError(data.error || "Failed to load debug data")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Debug load error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fixAllSubscriptions = async () => {
    setFixing(true)
    setError(null)

    try {
      const response = await fetch("/api/debug-subscription-days", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        // Reload debug data to see the changes
        await loadDebugData()
        alert(`Successfully fixed ${data.updates.length} subscriptions!`)
      } else {
        setError(data.error || "Failed to fix subscriptions")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Fix error:", err)
    } finally {
      setFixing(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Bug className="h-6 w-6" />
            Debug Subscription Days
          </h1>
          <p className="text-gray-600">Check if subscription day counting is working correctly and fix any issues.</p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button onClick={loadDebugData} disabled={loading || fixing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Debug Data
          </Button>
          <Button onClick={fixAllSubscriptions} disabled={loading || fixing} variant="outline">
            <CheckCircle className={`mr-2 h-4 w-4 ${fixing ? "animate-spin" : ""}`} />
            {fixing ? "Fixing..." : "Fix All Subscriptions"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {debugData && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Debug Summary</CardTitle>
                <CardDescription>Current state of subscription day counting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{debugData.total_subscriptions}</div>
                    <div className="text-sm text-gray-600">Total Subscriptions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {debugData.debug_info.filter((d) => d.days_difference === 0).length}
                    </div>
                    <div className="text-sm text-gray-600">Correct Count</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {debugData.debug_info.filter((d) => d.days_difference !== 0).length}
                    </div>
                    <div className="text-sm text-gray-600">Incorrect Count</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {debugData.debug_info.filter((d) => d.is_active !== d.should_be_active).length}
                    </div>
                    <div className="text-sm text-gray-600">Wrong Status</div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <strong>Today:</strong> {new Date(debugData.today).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {debugData.debug_info.map((info) => (
                <Card key={info.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{info.subscription_name}</CardTitle>
                      <div className="flex gap-2">
                        {info.days_difference === 0 ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Correct
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Wrong Count
                          </Badge>
                        )}

                        {info.is_active === info.should_be_active ? (
                          <Badge variant="outline">Status OK</Badge>
                        ) : (
                          <Badge variant="destructive">Wrong Status</Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>User ID: {info.user_id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Activation Date:</span>
                        <br />
                        {info.activation_date_formatted}
                      </div>
                      <div>
                        <span className="font-medium">Current Days Used:</span>
                        <br />
                        <span className={info.days_difference === 0 ? "text-green-600" : "text-red-600"}>
                          {info.current_days_used}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Should Be:</span>
                        <br />
                        <span className="font-semibold">{info.calculated_days_should_be}</span>
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>
                        <br />
                        {info.duration_days} days
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Current Status:</span>
                        <br />
                        <Badge variant={info.is_active ? "default" : "secondary"}>
                          {info.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Should Be:</span>
                        <br />
                        <Badge variant={info.should_be_active ? "default" : "secondary"}>
                          {info.should_be_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Is Expired:</span>
                        <br />
                        <Badge variant={info.is_expired ? "destructive" : "outline"}>
                          {info.is_expired ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Days Difference:</span>
                        <br />
                        <span className={info.days_difference === 0 ? "text-green-600" : "text-red-600"}>
                          {info.days_difference > 0 ? "+" : ""}
                          {info.days_difference}
                        </span>
                      </div>
                    </div>

                    {info.days_difference !== 0 && (
                      <Alert className="mt-4 border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          <strong>Issue:</strong> Days used should be {info.calculated_days_should_be} but is currently{" "}
                          {info.current_days_used}. Difference: {info.days_difference} days.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="mt-4 text-xs text-gray-500 space-y-1">
                      <div>Raw calculation: {info.raw_days_calculation.toFixed(2)} days</div>
                      <div>Time diff: {info.raw_time_diff_ms} ms</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              How Day Counting Works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Formula:</strong> Days Used = (Today - Activation Date) + 1
            </p>
            <p>
              <strong>Example:</strong> If activated on Jan 1st and today is Jan 4th: (Jan 4 - Jan 1) + 1 = 4 days used
            </p>
            <p>
              <strong>Status:</strong> Active if days used &lt; duration, Inactive if days used ≥ duration
            </p>
            <p>
              <strong>This tool:</strong> Shows what the count SHOULD be vs what it currently is, and can fix
              discrepancies.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
