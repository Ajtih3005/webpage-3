"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface RazorpayPaymentButtonProps {
  subscriptionId: number
  subscriptionName: string
  amount: number
  duration_days: number
  onSuccess?: () => void
  onError?: (error: any) => void
  buttonText?: string
  disabled?: boolean
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
}

export default function RazorpayPaymentButton({
  subscriptionId,
  subscriptionName,
  amount,
  duration_days,
  onSuccess,
  onError,
  buttonText = "Subscribe Now",
  disabled = false,
  variant = "default",
}: RazorpayPaymentButtonProps) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    try {
      setLoading(true)

      // Get user ID from localStorage
      const userId = localStorage.getItem("userId")
      if (!userId) {
        throw new Error("User ID not found. Please log in again.")
      }

      // Create order on the server
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          subscriptionId,
          userId,
          notes: {
            subscriptionName,
            duration_days,
          },
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order")
      }

      // Get user details
      const userEmail = localStorage.getItem("userEmail") || ""
      const userName = localStorage.getItem("userName") || ""
      const userPhone = localStorage.getItem("userPhone") || ""

      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "STHAVISHTAH YOGA AND WELLNESS",
        description: `Subscription: ${subscriptionName}`,
        order_id: orderData.order.id,
        handler: async (response: any) => {
          try {
            // Verify payment on the server
            const verifyResponse = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...response,
                subscriptionId,
                userId,
                amount,
                duration_days,
              }),
            })

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              if (onSuccess) onSuccess()
              // Redirect to success page
              window.location.href = `/user/payment-success?subscription=${subscriptionId}`
            } else {
              throw new Error(verifyData.error || "Payment verification failed")
            }
          } catch (error) {
            console.error("Payment verification error:", error)
            if (onError) onError(error)
            alert("Payment verification failed. Please contact support.")
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone,
        },
        notes: {
          subscriptionId: subscriptionId.toString(),
          userId,
          subscriptionName,
        },
        theme: {
          color: "#6366F1",
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()

      // Handle Razorpay modal close
      razorpay.on("payment.failed", (response: any) => {
        console.error("Payment failed:", response.error)
        if (onError) onError(response.error)
        alert(`Payment failed: ${response.error.description}`)
      })
    } catch (error) {
      console.error("Payment initiation error:", error)
      if (onError) onError(error)
      alert(error instanceof Error ? error.message : "Payment initiation failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handlePayment} disabled={disabled || loading} variant={variant} className="w-full">
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        buttonText
      )}
    </Button>
  )
}
