"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SupabaseTest() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [tables, setTables] = useState<string[]>([])

  useEffect(() => {
    testConnection()
  }, [])

  async function testConnection() {
    try {
      setStatus("loading")
      const supabase = getSupabaseBrowserClient()

      // Test the connection by fetching the list of tables
      const { data, error } = await supabase.from("pg_catalog.pg_tables").select("tablename").eq("schemaname", "public")

      if (error) throw error

      setTables(data.map((row) => row.tablename))
      setMessage("Successfully connected to Supabase!")
      setStatus("success")
    } catch (error: any) {
      console.error("Connection error:", error)
      setMessage(`Error connecting to Supabase: ${error.message || "Unknown error"}`)
      setStatus("error")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            className={`p-4 rounded-md ${
              status === "loading"
                ? "bg-gray-100"
                : status === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {status === "loading" ? "Testing connection..." : message}
          </div>

          {status === "success" && (
            <div>
              <h3 className="font-medium mb-2">Available tables:</h3>
              <ul className="list-disc pl-5">
                {tables.length > 0 ? (
                  tables.map((table) => <li key={table}>{table}</li>)
                ) : (
                  <li>No tables found in the public schema</li>
                )}
              </ul>
            </div>
          )}

          <Button onClick={testConnection} disabled={status === "loading"}>
            {status === "loading" ? "Testing..." : "Test Connection Again"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
