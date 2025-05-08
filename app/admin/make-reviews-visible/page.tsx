"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import ReviewStats from "@/components/review-stats"

export default function MakeReviewsVisible() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviewCount, setReviewCount] = useState<number | null>(null)

  const handleMakeVisible = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/ensure-reviews-visible")
      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setReviewCount(data.count || null)
      } else {
        setError(data.error || "Failed to make reviews visible")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Review Management</h1>

      <div className="mb-8">
        <ReviewStats />
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Make Reviews Visible</CardTitle>
          <CardDescription>Ensure all reviews are published and visible on the homepage</CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success!</AlertTitle>
              <AlertDescription className="text-green-700">
                {reviewCount ? `${reviewCount} reviews` : "All reviews"} are now visible on the homepage.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Error</AlertTitle>
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-gray-600 mb-4">
            This will ensure that all your reviews are published and visible in the review carousel on the homepage.
            Users will be able to navigate through all reviews using the pagination controls.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleMakeVisible} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : success ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Refresh Reviews
              </>
            ) : (
              "Make All Reviews Visible"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
