"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function RazorpayAmountTest() {
  const [amount, setAmount] = useState<string>("998.98")
  const [amountInPaise, setAmountInPaise] = useState<number>(0)
  const [testResults, setTestResults] = useState<any[]>([])

  const calculatePaise = () => {
    const numAmount = Number.parseFloat(amount)
    if (isNaN(numAmount)) {
      alert("Please enter a valid number")
      return
    }

    const paise = Math.round(numAmount * 100)
    setAmountInPaise(paise)

    // Add to test results
    setTestResults([
      ...testResults,
      {
        amount: numAmount,
        amountString: amount,
        paise,
        timestamp: new Date().toISOString(),
      },
    ])
  }

  const testCreateOrder = async () => {
    try {
      const numAmount = Number.parseFloat(amount)
      if (isNaN(numAmount)) {
        alert("Please enter a valid number")
        return
      }

      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: numAmount,
          subscriptionId: 999,
          userId: "test-user",
          notes: {
            test: true,
          },
        }),
      })

      const data = await response.json()

      setTestResults([
        ...testResults,
        {
          type: "API Test",
          amount: numAmount,
          amountString: amount,
          expectedPaise: Math.round(numAmount * 100),
          actualPaise: data.order?.amount,
          success: data.success,
          orderId: data.order?.id,
          timestamp: new Date().toISOString(),
        },
      ])
    } catch (error) {
      console.error("Test failed:", error)
      setTestResults([
        ...testResults,
        {
          type: "API Test",
          amount: Number.parseFloat(amount),
          amountString: amount,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
      ])
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Razorpay Amount Conversion Test</CardTitle>
          <CardDescription>Test the conversion of amounts to paise for Razorpay</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <Input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (e.g., 998.98)"
              />
              <Button onClick={calculatePaise}>Calculate Paise</Button>
              <Button variant="outline" onClick={testCreateOrder}>
                Test API
              </Button>
            </div>

            {amountInPaise > 0 && (
              <div className="p-4 bg-gray-100 rounded">
                <p>
                  <strong>Amount:</strong> ₹{Number.parseFloat(amount).toFixed(2)}
                </p>
                <p>
                  <strong>Amount in Paise:</strong> {amountInPaise}
                </p>
              </div>
            )}

            {testResults.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Test Results</h3>
                <div className="border rounded overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paise
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Result
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {testResults.map((result, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.type || "Calculation"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ₹{result.amount.toFixed(2)} ({result.amountString})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.type === "API Test"
                              ? `${result.expectedPaise} → ${result.actualPaise || "Error"}`
                              : result.paise}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.type === "API Test" ? (
                              result.success ? (
                                <span className="text-green-500">Success (Order ID: {result.orderId})</span>
                              ) : (
                                <span className="text-red-500">{result.error || "Failed"}</span>
                              )
                            ) : (
                              "OK"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-gray-500">
            Razorpay requires amounts in paise (1/100th of a rupee). This tool helps verify the conversion is working
            correctly.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
