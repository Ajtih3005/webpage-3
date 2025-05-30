"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, LogIn, UserPlus, Leaf } from "lucide-react"
import Image from "next/image"

export default function LinkRedirectPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requiresLogin, setRequiresLogin] = useState(false)
  const [linkData, setLinkData] = useState<any>(null)

  useEffect(() => {
    async function processLink() {
      try {
        console.log("🔗 Processing link token:", params.token)

        // Step 1: Validate the link
        const validateResponse = await fetch(`/api/links/validate/${params.token}`)
        const validateData = await validateResponse.json()

        console.log("🔍 Validation response:", validateData)

        if (!validateResponse.ok) {
          if (validateData.requiresLogin) {
            console.log("🔐 Login required - showing login/register page")
            setRequiresLogin(true)
            setLinkData(validateData.linkInfo)
            setError("You need to log in to access this content")
          } else {
            console.log("❌ Validation failed:", validateData.error)
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

  const handleLogin = () => {
    console.log("🔐 Redirecting to login")
    router.push(`/user/login?redirect=/l/${params.token}`)
  }

  const handleRegister = () => {
    console.log("📝 Redirecting to register")
    router.push(`/user/register?redirect=/l/${params.token}`)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center forest-bg relative overflow-hidden">
        <div className="absolute inset-0 leaf-pattern opacity-20"></div>
        <div className="text-center relative z-10">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-white">Processing Link...</h2>
          <p className="text-white/80">Validating access and redirecting...</p>
        </div>
      </div>
    )
  }

  // 🚨 LOGIN/REGISTER REQUIRED STATE - SHOWS BOTH BUTTONS
  if (requiresLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 forest-bg relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 leaf-pattern opacity-20"></div>

        {/* Floating Elements */}
        <div className="absolute top-10 left-10 opacity-30">
          <Leaf className="h-8 w-8 text-white animate-pulse" />
        </div>
        <div className="absolute top-20 right-20 opacity-20">
          <Leaf className="h-12 w-12 text-white animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        <div className="absolute bottom-20 left-20 opacity-25">
          <Leaf className="h-6 w-6 text-white animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo Section */}
          <div className="text-center mb-6 animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-full shadow-lg">
                <div className="relative h-16 w-16">
                  <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" priority />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">STHAVISHTAH</h1>
            <p className="text-white/80 text-sm tracking-widest">YOGA AND WELLNESS</p>
            <div className="w-24 h-1 bg-white/30 mx-auto mt-3 rounded-full"></div>
          </div>

          {/* Access Required Card */}
          <Card className="nature-card shadow-2xl border-0 animate-slide-up">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-semibold forest-text-gradient">🔐 Access Required</CardTitle>
              <CardDescription className="text-gray-600">
                {linkData?.title
                  ? `You need an account to access "${linkData.title}"`
                  : "You need an account to access this content"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <Leaf className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Protected Content</AlertTitle>
                <AlertDescription className="text-green-700">
                  This content is available to our community members. Please log in or create an account to continue.
                </AlertDescription>
              </Alert>

              {linkData?.description && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <strong>About this content:</strong> {linkData.description}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              {/* 🚨 BOTH LOGIN AND REGISTER BUTTONS */}
              <div className="flex w-full gap-3">
                <Button onClick={handleLogin} className="flex-1 forest-button">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
                <Button onClick={handleRegister} variant="outline" className="flex-1 forest-outline-button">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Already have an account?</strong> Click Login to access your content immediately.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>New to our wellness community?</strong> Click Register to join us and unlock exclusive
                  content.
                </p>
              </div>

              {/* Back to Home */}
              <div className="text-center pt-2">
                <Button variant="link" onClick={() => router.push("/")} className="text-green-600 hover:text-green-700">
                  ← Back to Home
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Error state
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
