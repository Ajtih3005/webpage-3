"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { UserLayout } from "@/components/user-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const subscriptionId = searchParams.get("subscription")
  const [subscriptionName, setSubscriptionName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubscriptionDetails() {
      if (!subscriptionId) return

      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase.from("subscriptions").select("name").eq("id", subscriptionId).single()

        if (error) throw error
        if (data) setSubscriptionName(data.name)
      } catch (error) {
        console.error("Error fetching subscription details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptionDetails()
  }, [subscriptionId])

  return (
    <UserLayout>
      <div className="max-w-md mx-auto">
        <Card className="border-green-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
            <CardDescription>Thank you for your subscription</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {loading ? (
              <p>Loading subscription details...</p>
            ) : (
              <>
                <p className="mb-4">
                  Your payment has been processed successfully and your subscription to{" "}
                  <span className="font-semibold">{subscriptionName || "our service"}</span> is now active.
                </p>
                <p className="text-sm text-muted-foreground">
                  You can now access all the premium courses and content included in your subscription.
                </p>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href="/user/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/user/subscriptions">View My Subscriptions</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </UserLayout>
  )
}
