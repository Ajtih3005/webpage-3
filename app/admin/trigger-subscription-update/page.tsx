"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"

export default function TriggerSubscriptionUpdatePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const triggerUpdate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log("[v0] Manually triggering subscription day update...")
      const response = await fetch("/api/update-subscription-days", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Failed to update: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Update result:", data)
      setResult(data)
    } catch (err: any) {
      console.error("[v0] Update failed:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Manual Subscription Day Update</CardTitle>
          <CardDescription>
            Trigger the subscription day counter to backfill missed days and update all active subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This will calculate all days since activation for each subscription and update the count immediately. Use
              this to backfill any missed days before the automatic cron job starts running.
            </p>
          </div>

          <Button onClick={triggerUpdate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Trigger Update Now
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Update Successful!</p>
                  <p className="text-sm">Total subscriptions processed: {result.totalProcessed || 0}</p>
                  <p className="text-sm">Updated: {result.updatedCount || 0}</p>
                  <p className="text-sm">Expired: {result.expiredCount || 0}</p>
                  <p className="text-sm">Already expired: {result.alreadyExpiredCount || 0}</p>
                  <p className="text-sm">Skipped (inactive): {result.skippedDueToInactiveSubscription || 0}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
