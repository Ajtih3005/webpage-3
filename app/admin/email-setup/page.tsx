"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"

export default function EmailSetupPage() {
  const [adminPassword, setAdminPassword] = useState("")
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const savePassword = () => {
    if (!adminPassword.trim()) {
      setStatus({
        type: "error",
        message: "Please enter a password",
      })
      return
    }

    // Save to localStorage
    localStorage.setItem("adminPassword", adminPassword)

    setStatus({
      type: "success",
      message: "Admin password saved successfully! You can now send emails.",
    })
  }

  const useDefaultPassword = () => {
    const defaultPassword = "!@#$%^&*()AjItH"
    localStorage.setItem("adminPassword", defaultPassword)
    setAdminPassword(defaultPassword)

    setStatus({
      type: "success",
      message: "Default admin password set successfully!",
    })
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Email Setup</h1>
          <p className="text-gray-600 mt-2">Configure admin password for email sending</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Password Setup</CardTitle>
            <CardDescription>Set the admin password required for sending bulk emails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={savePassword} className="flex-1">
                Save Password
              </Button>
              <Button onClick={useDefaultPassword} variant="outline" className="flex-1">
                Use Default Password
              </Button>
            </div>

            {status && (
              <Alert variant={status.type === "success" ? "default" : "destructive"}>
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            )}

            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Default Passwords:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Default: !@#$%^&*()AjItH</li>
                <li>• Simple: admin123</li>
                <li>• Environment: {process.env.ADMIN_PASSWORD ? "Set" : "Not set"}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
