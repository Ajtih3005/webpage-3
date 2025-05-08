"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AutoInsertReviews() {
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState("checking")

  useEffect(() => {
    async function processReviews() {
      try {
        // Step 1: Ensure the reviews table exists
        setStep("checking")
        await fetch("/api/ensure-reviews-table")

        // Step 2: Insert the reviews
        setStep("inserting")
        const response = await fetch("/api/direct-insert-reviews")
        const data = await response.json()

        if (data.success) {
          setSuccess(true)
          setMessage(data.message)
        } else {
          setError(data.error || "Failed to insert reviews")
        }
      } catch (err) {
        setError("An unexpected error occurred")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    processReviews()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Adding Reviews Automatically</CardTitle>
          <CardDescription>Adding 43 random yoga-related reviews to your database</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-green-600 animate-spin mb-4" />
              <p className="text-gray-600">
                {step === "checking" ? "Checking database..." : "Adding reviews to your database..."}
              </p>
            </div>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success!</AlertTitle>
              <AlertDescription className="text-green-700">{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Error</AlertTitle>
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {!loading && (
            <div className="mt-6 flex justify-center">
              <Link href="/">
                <Button>Go to Homepage</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
