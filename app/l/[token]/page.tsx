"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, LogIn } from "lucide-react"

export default function LinkRedirectPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requiresLogin, setRequiresLogin] = useState(false)

  useEffect(() => {
    async function processLink() {
      try {
        console.log("🔗 Processing link token:", params.token)

        // Step 1: Validate the link
        const validateResponse = await fetch(`/api/links/validate/${params.token}`)
        const validateData = await validateResponse.json()

        if (!validateResponse.ok) {
          if (validateData.requiresLogin) {
            setRequiresLogin(true)
            setError("You need to log in to access this link")
          } else {
            setError(validateData.error || "Link validation failed")
          }
          setLoading(false)
          return
        }

        console.log("✅ Link validated, now using it...")

        // Step 2: Use the link
        const useResponse = await fetch(`/api/links/use/${params.token}`, {
          method: "POST",
        })
        const useData = await useResponse.json()

        if (!useResponse.ok) {
          setError(useData.error || "Failed to use link")
          setLoading(false)
          return
        }

        console.log("✅ Link used successfully, redirecting to:", useData.target_url)

        // Step 3: Redirect
        window.location.href = useData.target_url
      } catch (err) {
        console.error("❌ Link processing error:", err)
        setError("An unexpected error occurred")
        setLoading(false)
      }
    }

    processLink()
  }, [params.token])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Processing Link...</h2>
          <p className="text-gray-600">Validating access and redirecting...</p>
        </div>
      </div>
    )
  }

  if (requiresLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-blue-600">Login Required</CardTitle>
            <CardDescription>You need to log in to access this link</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <LogIn className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                This link requires you to be logged in to verify your identity and access permissions.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/")}>
              Go Home
            </Button>
            <Button onClick={() => router.push(`/user/login?redirect=/l/${params.token}`)}>
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Access Denied</CardTitle>
            <CardDescription>There was a problem with this link</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/")}>Return to Home</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return null
}
