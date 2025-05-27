"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, LogIn } from "lucide-react"

interface LinkData {
  id: string
  title: string
  description: string
  target_url: string
  link_type: string
}

interface UserInfo {
  loggedIn: boolean
  userId?: string
}

export default function LinkRedirectPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linkData, setLinkData] = useState<LinkData | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [requiresLogin, setRequiresLogin] = useState(false)
  const [loginUrl, setLoginUrl] = useState<string>("")

  useEffect(() => {
    async function validateLink() {
      try {
        const response = await fetch(`/api/links/validate/${params.token}`)
        const data = await response.json()

        if (!response.ok) {
          if (data.requiresLogin) {
            setRequiresLogin(true)
            setLoginUrl(data.loginUrl || `/user/login?redirect=/l/${params.token}`)
            setError("You need to log in to access this link")
          } else {
            setError(data.error || "Failed to validate link")
          }
          setLoading(false)
          return
        }

        setLinkData(data.link)
        setUserInfo(data.userInfo)
        setLoading(false)
      } catch (err) {
        setError("An unexpected error occurred")
        setLoading(false)
      }
    }

    validateLink()
  }, [params.token])

  const handleRedirect = async () => {
    setRedirecting(true)
    try {
      const response = await fetch(`/api/links/use/${params.token}`, {
        method: "POST",
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to use link")
        setRedirecting(false)
        return
      }

      // Redirect to the target URL
      window.location.href = data.target_url
    } catch (err) {
      setError("An unexpected error occurred")
      setRedirecting(false)
    }
  }

  const handleLogin = () => {
    router.push(loginUrl)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Validating link...</span>
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
            <Button onClick={handleLogin}>
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

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{linkData?.title}</CardTitle>
          {linkData?.description && <CardDescription>{linkData.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            You are about to be redirected to {linkData?.link_type === "session" ? "a session" : "a WhatsApp group"}.
          </p>

          {userInfo && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
              <p className="text-sm text-green-800">
                {userInfo.loggedIn ? `✓ Logged in as User ${userInfo.userId}` : "✓ Public access link"}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/")}>
            Cancel
          </Button>
          <Button onClick={handleRedirect} disabled={redirecting}>
            {redirecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
