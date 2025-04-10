"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function AdminDebug() {
  const router = useRouter()
  const [sessionData, setSessionData] = useState<Record<string, string>>({})

  useEffect(() => {
    // Get all session storage items
    const data: Record<string, string> = {}
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key) {
        data[key] = sessionStorage.getItem(key) || ""
      }
    }
    setSessionData(data)
  }, [])

  const resetAdminAuth = () => {
    sessionStorage.setItem("adminAuthenticated", "true")
    setSessionData({
      ...sessionData,
      adminAuthenticated: "true",
    })
  }

  const clearSession = () => {
    sessionStorage.clear()
    setSessionData({})
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Admin Session Debug</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Session Storage Data</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(sessionData).length > 0 ? (
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto">{JSON.stringify(sessionData, null, 2)}</pre>
          ) : (
            <p>No data in session storage</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={resetAdminAuth}>Set Admin Auth to True</Button>
        <Button onClick={clearSession} variant="destructive">
          Clear Session Storage
        </Button>
        <Button onClick={() => router.push("/admin/dashboard")} variant="outline">
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
