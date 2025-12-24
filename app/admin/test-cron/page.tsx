"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestCronPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testCronJob = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/update-subscription-days", {
        method: "GET",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(`Error ${response.status}: ${data.error || "Unknown error"}`)
      } else {
        setResult(data)
      }
    } catch (err: any) {
      setError(err.message || "Failed to call cron job")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Subscription Day Update Cron Job</CardTitle>
          <CardDescription>
            Manually trigger the daily subscription day update to test if the database logic is working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testCronJob} disabled={loading} size="lg" className="w-full">
            {loading ? "Running..." : "Run Subscription Update Now"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="font-mono text-sm whitespace-pre-wrap">{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-green-600">✓ Success!</p>
                  <div className="font-mono text-sm bg-gray-50 p-4 rounded overflow-auto max-h-96">
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
            <p>
              <strong>What this does:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Fetches all active subscriptions from the database</li>
              <li>Decrements remaining_days by 1 for each subscription</li>
              <li>Shows you how many subscriptions were updated</li>
            </ul>
            <p className="pt-2">
              <strong>Cron Schedule:</strong> Daily at 00:00 UTC (midnight)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
