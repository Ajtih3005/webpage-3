"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"

export default function RazorpayTestPage() {
  const [loading, setLoading] = useState(true)
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [scriptError, setScriptError] = useState<string | null>(null)

  useEffect(() => {
    // Check if Razorpay script is loaded
    if (typeof window !== "undefined") {
      // Try to load Razorpay script
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = () => {
        console.log("Razorpay script loaded successfully")
        setScriptLoaded(true)
      }
      script.onerror = () => {
        console.error("Failed to load Razorpay script")
        setScriptError("Failed to load Razorpay script. This could be due to network issues or content blockers.")
      }
      document.body.appendChild(script)
    }

    // Run diagnostics
    async function runDiagnostics() {
      try {
        setLoading(true)
        const response = await fetch("/api/razorpay/diagnostics")
        if (response.ok) {
          const data = await response.json()
          setDiagnostics(data)
        } else {
          console.error("Failed to fetch diagnostics:", await response.text())
        }
      } catch (error) {
        console.error("Error running diagnostics:", error)
      } finally {
        setLoading(false)
      }
    }

    runDiagnostics()
  }, [])

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Razorpay Integration Test</h1>

        {loading ? (
          <div className="flex justify-center my-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Razorpay Script Status</CardTitle>
                <CardDescription>Checks if the Razorpay JavaScript SDK can be loaded</CardDescription>
              </CardHeader>
              <CardContent>
                {scriptLoaded ? (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertTitle className="text-green-800">Script Loaded Successfully</AlertTitle>
                    <AlertDescription className="text-green-700">
                      The Razorpay checkout script was loaded successfully. This means your users should be able to see
                      the payment form.
                    </AlertDescription>
                  </Alert>
                ) : scriptError ? (
                  <Alert variant="destructive">
                    <XCircle className="h-5 w-5" />
                    <AlertTitle>Script Loading Failed</AlertTitle>
                    <AlertDescription>{scriptError}</AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Loading Script</AlertTitle>
                    <AlertDescription>Checking if Razorpay script can be loaded...</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {diagnostics && (
              <Card>
                <CardHeader>
                  <CardTitle>Configuration Diagnostics</CardTitle>
                  <CardDescription>Checks your Razorpay API configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">Environment</h3>
                        <p>{diagnostics.diagnostics.environment}</p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium">Key Type</h3>
                        <p>{diagnostics.diagnostics.razorpay_key_id.type || "Unknown"}</p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium">Server Key</h3>
                        <p className="flex items-center">
                          {diagnostics.diagnostics.razorpay_key_id.exists ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              {diagnostics.diagnostics.razorpay_key_id.value}
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-600 mr-2" />
                              Missing
                            </>
                          )}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium">Secret Key</h3>
                        <p className="flex items-center">
                          {diagnostics.diagnostics.key_secret.exists ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              {diagnostics.diagnostics.key_secret.value}
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-600 mr-2" />
                              Missing
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {diagnostics.warnings && diagnostics.warnings.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Configuration Warnings</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc pl-5 mt-2">
                            {diagnostics.warnings.map((warning: string, i: number) => (
                              <li key={i}>{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {diagnostics.recommendations && diagnostics.recommendations.length > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Recommendations</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc pl-5 mt-2">
                            {diagnostics.recommendations.map((rec: string, i: number) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => window.location.reload()}>Run Diagnostics Again</Button>
                </CardFooter>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Common Issues & Solutions</CardTitle>
                <CardDescription>Troubleshooting guide for Razorpay integration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Payment Modal Not Opening</h3>
                    <ul className="list-disc pl-5 mt-2">
                      <li>Check if Razorpay script is loading (see status above)</li>
                      <li>Verify your API key is correctly set in RAZORPAY_KEY_ID</li>
                      <li>Check browser console for JavaScript errors</li>
                      <li>Try disabling ad blockers or content blockers</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium">Payment Failing After Modal Opens</h3>
                    <ul className="list-disc pl-5 mt-2">
                      <li>Verify your server key and secret are correctly set</li>
                      <li>Check if you're using test keys with test cards</li>
                      <li>Ensure the amount is properly formatted (in paise)</li>
                      <li>Check server logs for detailed error messages</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium">Verification Failing</h3>
                    <ul className="list-disc pl-5 mt-2">
                      <li>Ensure your RAZORPAY_KEY_SECRET is correctly set</li>
                      <li>Check if the signature verification logic is correct</li>
                      <li>Verify that the order ID and payment ID are being passed correctly</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium">Test vs Live Keys</h3>
                    <ul className="list-disc pl-5 mt-2">
                      <li>Test keys start with "rzp_test_" and only work with test cards</li>
                      <li>Live keys start with "rzp_live_" and work with real payment methods</li>
                      <li>Make sure you're using the appropriate key for your environment</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
