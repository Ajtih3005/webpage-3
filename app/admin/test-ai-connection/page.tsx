"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TestAIConnectionPage() {
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [tables, setTables] = useState<Record<string, boolean>>({})

  const testConnection = async () => {
    setStatus("testing")
    setMessage("Testing AI database connection...")

    try {
      const response = await fetch("/api/ai-db-test")
      const data = await response.json()

      if (data.success) {
        setTables(data.tables)
        const allTablesExist = Object.values(data.tables).every((exists) => exists)

        if (allTablesExist) {
          setStatus("success")
          setMessage("AI database connection successful! All tables exist.")
        } else {
          setStatus("error")
          const missingTables = Object.entries(data.tables)
            .filter(([_, exists]) => !exists)
            .map(([table]) => table)
          setMessage(
            `Connection established but some tables are missing: ${missingTables.join(", ")}. Run the SQL scripts to create missing tables.`,
          )
        }
      } else {
        setStatus("error")
        setMessage(`Connection failed: ${data.error}`)
      }
    } catch (error) {
      console.error("[v0] AI Database test failed:", error)
      setStatus("error")
      setMessage(`Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>AI Database Connection Test</CardTitle>
          <CardDescription>Test connection to AI Supabase database and verify table schema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testConnection} disabled={status === "testing"}>
            {status === "testing" ? "Testing..." : "Test Connection"}
          </Button>

          {status !== "idle" && (
            <div
              className={`p-4 rounded-lg ${
                status === "success"
                  ? "bg-green-50 text-green-700"
                  : status === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-blue-50 text-blue-700"
              }`}
            >
              <p className="font-medium">{message}</p>
            </div>
          )}

          {Object.keys(tables).length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Table Status:</h3>
              <ul className="list-disc pl-6">
                {Object.entries(tables).map(([table, exists]) => (
                  <li key={table} className={exists ? "text-green-600" : "text-red-600"}>
                    {table}: {exists ? "✓ Exists" : "✗ Missing"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <h3 className="font-semibold text-foreground">Required Environment Variables (Server-side):</h3>
            <ul className="list-disc pl-6">
              <li>AI_SUPABASE_URL</li>
              <li>AI_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
