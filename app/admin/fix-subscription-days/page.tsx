"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, Zap, AlertTriangle, CheckCircle, Calendar, User } from "lucide-react"

interface UpdateResult {
  subscription_id: string
  subscription_name: string
  user_id?: string
  old_days?: number
  new_days?: number
  old_status?: string
  new_status?: string
  activation_date?: string
  days_since_activation?: number
  duration_days?: number
  remaining_days?: number
  error?: string
  message?: string
}

interface ForceUpdateResponse {
  success: boolean
  message: string
  updated: number
  total_checked: number
  timestamp: string
  results: UpdateResult[]
  error?: string
}

export default function FixSubscriptionDays() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ForceUpdateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleForceUpdate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/force-update-subscription-days", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || "Failed to update subscriptions")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Force update error:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Zap className="h-6 w-6 text-orange-600" />
            Fix Subscription Day Counting
          </h1>
          <p className="text-gray-600">
            Force recalculate all subscription days based on activation dates. Use this when day counting appears stuck.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Force Update All Subscriptions
            </CardTitle>
            <CardDescription>
              This will recalculate days for ALL subscriptions based on their activation dates and fix any
              inconsistencies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleForceUpdate} disabled={loading} className="flex items-center gap-2" size="lg">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Updating All Subscriptions..." : "Force Update All Subscriptions"}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Update Results
                </CardTitle>
                <CardDescription>Completed at {new Date(result.timestamp).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{result.total_checked}</div>
                    <div className="text-sm text-gray-600">Total Checked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.updated}</div>
                    <div className="text-sm text-gray-600">Updated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {result.results.filter((r) => r.message === "no_change_needed").length}
                    </div>
                    <div className="text-sm text-gray-600">No Change Needed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {result.results.filter((r) => r.error).length}
                    </div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                </div>
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{result.message}</AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Detailed Results</h2>

              {result.results.map((item, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{item.subscription_name}</CardTitle>
                      <div className="flex gap-2">
                        {item.error ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Error
                          </Badge>
                        ) : item.message === "no_change_needed" ? (
                          <Badge variant="outline">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            No Change
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Updated
                          </Badge>
                        )}
                      </div>
                    </div>
                    {item.user_id && (
                      <CardDescription className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        User ID: {item.user_id}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {item.error ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{item.error}</AlertDescription>
                      </Alert>
                    ) : item.message === "no_change_needed" ? (
                      <div className="text-sm text-gray-600">
                        Subscription is already correctly calculated with {item.days} days used.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Days Used:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-red-600">{item.old_days || 0}</span>
                              <span>→</span>
                              <span className="text-green-600 font-semibold">{item.new_days}</span>
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Status:</span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={item.old_status === "active" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {item.old_status}
                              </Badge>
                              <span>→</span>
                              <Badge
                                variant={item.new_status === "active" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {item.new_status}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Remaining:</span>
                            <div className="font-semibold text-blue-600">{item.remaining_days} days</div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Duration:</span>
                            <div>{item.duration_days} days</div>
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Activation Date:</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {item.activation_date ? formatDate(item.activation_date) : "Not set"}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Days Since Activation:</span>
                            <div className="font-semibold">{item.days_since_activation} days</div>
                          </div>
                        </div>

                        {item.new_days !== item.old_days && (
                          <Alert className="bg-blue-50 border-blue-200">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                              <strong>Fixed:</strong> Days used corrected from {item.old_days || 0} to {item.new_days}
                              (difference: {(item.new_days || 0) - (item.old_days || 0)} days)
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
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
              How This Fix Works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Calculation:</strong> Days Used = (Today - Activation Date) + 1
            </p>
            <p>
              <strong>Status Update:</strong> Sets subscription as inactive if all days are used
            </p>
            <p>
              <strong>Data Integrity:</strong> Ensures all subscriptions have correct day counts based on actual time
              elapsed
            </p>
            <p>
              <strong>Use Case:</strong> Run this when subscriptions show 0 days used despite being activated days ago
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
