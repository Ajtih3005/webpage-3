"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle, XCircle, Settings, ExternalLink, AlertTriangle } from "lucide-react"

export default function EmailTestPage() {
  const [testEmail, setTestEmail] = useState("sthavishtah2024@gmail.com") // Pre-fill with verified email
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ type: "success" | "error"; message: string; details?: any } | null>(
    null,
  )

  const testEmailConfig = async () => {
    if (!testEmail) {
      setTestResult({
        type: "error",
        message: "Please enter a test email address",
      })
      return
    }

    try {
      setTesting(true)
      setTestResult(null)

      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testEmail,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTestResult({
          type: "success",
          message: data.message,
          details: data,
        })
      } else {
        setTestResult({
          type: "error",
          message: data.message || "Email test failed",
          details: data,
        })
      }
    } catch (error) {
      console.error("Error testing email:", error)
      setTestResult({
        type: "error",
        message: "An unexpected error occurred during email test",
      })
    } finally {
      setTesting(false)
    }
  }

  const useVerifiedEmail = () => {
    setTestEmail("sthavishtah2024@gmail.com")
    setTestResult(null)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Email Configuration Test</h1>
        </div>

        {/* Domain Verification Warning */}
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Domain Verification Required:</strong> Currently, you can only send test emails to{" "}
            <code className="bg-yellow-100 px-1 rounded">sthavishtah2024@gmail.com</code> (your verified email). To send
            to other recipients, verify a domain at{" "}
            <a
              href="https://resend.com/domains"
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center"
            >
              resend.com/domains <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>

        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Test Email Configuration</CardTitle>
            <CardDescription>Send a test email using Resend API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="test-email" className="text-sm font-medium">
                Test Email Address
              </label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email address to test"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={useVerifiedEmail} className="text-xs">
                  Use Verified Email
                </Button>
                <span className="text-xs text-gray-500 flex items-center">
                  (sthavishtah2024@gmail.com works without domain verification)
                </span>
              </div>
            </div>

            {testResult && (
              <Alert variant={testResult.type === "success" ? "default" : "destructive"}>
                {testResult.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertDescription>
                  <div>{testResult.message}</div>
                  {testResult.details && testResult.details.instructions && (
                    <div className="mt-2 text-xs space-y-1">
                      <div>
                        <strong>Quick fix:</strong> {testResult.details.instructions.immediate}
                      </div>
                      <div>
                        <strong>For production:</strong> {testResult.details.instructions.longTerm}
                      </div>
                    </div>
                  )}
                  {testResult.details && testResult.details.messageId && (
                    <div className="mt-1 text-xs">
                      <strong>Message ID:</strong> {testResult.details.messageId}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={testEmailConfig} disabled={testing || !testEmail} className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              {testing ? "Sending Test Email..." : "Send Test Email"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Settings className="inline mr-2 h-5 w-5" />
              Domain Verification Setup
            </CardTitle>
            <CardDescription>For sending emails to any recipient</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">🚀 Quick Steps:</h4>
                <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                  <li>
                    Go to{" "}
                    <a
                      href="https://resend.com/domains"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline inline-flex items-center"
                    >
                      resend.com/domains <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </li>
                  <li>Add your domain (e.g., yourdomain.com)</li>
                  <li>Add the DNS records to your domain provider</li>
                  <li>Wait for verification (usually 5-10 minutes)</li>
                  <li>Update the "from" address in your email code</li>
                </ol>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">✅ Current Status:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Can send to: sthavishtah2024@gmail.com</li>
                  <li>• API Key: Configured ✓</li>
                  <li>• Service: Resend API ✓</li>
                  <li>• Domain: Not verified (optional for testing)</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">💡 For Now:</h4>
                <p className="text-sm text-yellow-700">
                  Use <code className="bg-yellow-100 px-1 rounded">sthavishtah2024@gmail.com</code> for testing. This is
                  your verified email address and will work immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
