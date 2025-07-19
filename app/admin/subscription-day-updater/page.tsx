"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Calendar, AlertCircle, CheckCircle, Clock } from "lucide-react"

interface UpdateResult {
  subscription_id: string
  subscription_name: string
  user_id?: string
  activation_date?: string
  old_days?: number
  new_days?: number
  correct_days?: number
  days_since_activation?: number
  duration_days?: number
  was_active?: boolean
  now_active?: boolean
  changed?: boolean
  deactivated?: boolean
  status?: string
  error?: string
}

interface UpdateResponse {
  success: boolean
  message: string
  updated: number
  total_checked?: number
  total_processed?: number
  results: UpdateResult[]
  error?: string
  details?: string
}

export default function SubscriptionDayUpdater() {
  const [updating, setUpdating] = useState(false)
  const [forceUpdating, setForceUpdating] = useState(false)
  const [result, setResult] = useState<UpdateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRegularUpdate = async () => {
    setUpdating(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/update-subscription-days", {
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
      console.error("Update error:", err)
    } finally {
      setUpdating(false)
    }
  }

  const handleForceUpdate = async () => {
    setForceUpdating(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/force-update-subscription-days", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || "Failed to force update subscriptions")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Force update error:", err)
    } finally {
      setForceUpdating(false)
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
          <h1 className="text-2xl font-bold mb-2">Subscription Day Counter</h1>
          <p className="text-gray-600">
            Update subscription day counts based on activation dates. This calculates how many days have passed since
            activation.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Regular Update
              </CardTitle>
              <CardDescription>Updates only active subscriptions that need day count adjustments</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleRegularUpdate} disabled={updating || forceUpdating} className="w-full">
                {updating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Update Active Subscriptions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Force Update All
              </CardTitle>
              <CardDescription>
                Recalculates ALL subscription days from activation dates (use if data is inconsistent)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleForceUpdate}
                disabled={updating || forceUpdating}
                variant="outline"
                className="w-full bg-transparent"
              >
                {forceUpdating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Force Updating...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Force Update All Subscriptions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Update Results
              </CardTitle>
              <CardDescription>
                {result.message} • Processed: {result.total_checked || result.total_processed || 0} subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.results && result.results.length > 0 ? (
                <div className="space-y-4">
                  {result.results.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{item.subscription_name}</h4>
                          <p className="text-sm text-gray-600">ID: {item.subscription_id}</p>
                          {item.user_id && <p className="text-sm text-gray-600">User: {item.user_id}</p>}
                        </div>
                        <div className="flex gap-2">
                          {item.error ? (
                            <Badge variant="destructive">Error</Badge>
                          ) : item.status === "no_change_needed" ? (
                            <Badge variant="secondary">No Change</Badge>
                          ) : item.changed ? (
                            <Badge variant="default">Updated</Badge>
                          ) : (
                            <Badge variant="outline">Processed</Badge>
                          )}

                          {item.now_active !== undefined && (
                            <Badge variant={item.now_active ? "default" : "secondary"}>
                              {item.now_active ? "Active" : "Inactive"}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {item.error ? (
                        <Alert variant="destructive">
                          <AlertDescription>{item.error}</AlertDescription>
                        </Alert>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {item.activation_date && (
                            <div>
                              <span className="font-medium">Activated:</span>
                              <br />
                              {formatDate(item.activation_date)}
                            </div>
                          )}

                          {item.days_since_activation !== undefined && (
                            <div>
                              <span className="font-medium">Days Since:</span>
                              <br />
                              {item.days_since_activation} days
                            </div>
                          )}

                          {(item.old_days !== undefined ||
                            item.new_days !== undefined ||
                            item.correct_days !== undefined) && (
                            <div>
                              <span className="font-medium">Days Used:</span>
                              <br />
                              {item.old_days !== undefined && item.new_days !== undefined ? (
                                <span>
                                  {item.old_days} → <strong>{item.new_days}</strong>
                                </span>
                              ) : item.correct_days !== undefined ? (
                                <strong>{item.correct_days}</strong>
                              ) : (
                                <strong>{item.new_days || item.old_days}</strong>
                              )}
                            </div>
                          )}

                          {item.duration_days && (
                            <div>
                              <span className="font-medium">Total Duration:</span>
                              <br />
                              {item.duration_days} days
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No detailed results available.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              How Day Counting Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Regular Update:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Only processes active subscriptions</li>
                  <li>• Calculates days since activation date</li>
                  <li>• Updates only if count has changed</li>
                  <li>• Deactivates expired subscriptions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Force Update:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Processes ALL subscriptions with activation dates</li>
                  <li>• Recalculates from scratch</li>
                  <li>• Fixes any inconsistent data</li>
                  <li>• Updates both active and inactive status</li>
                </ul>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Formula:</strong> Days Used = (Today - Activation Date) + 1, capped at subscription duration.
                <br />
                <strong>Example:</strong> Activated Jan 1st, today is Jan 4th = 4 days used.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
