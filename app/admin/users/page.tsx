"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Search, Download } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { getBatchLabel } from "@/lib/utils"

interface User {
  id: number
  user_id: string
  name: string
  email: string
  phone_number: string
  whatsapp_number: string | null
  preferred_batch: string | null
  created_at: string
}

export default function ManageUsers() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone_number.includes(searchQuery) ||
      user.user_id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const exportToCSV = () => {
    // Create CSV content
    const headers = ["User ID", "Name", "Email", "Phone Number", "WhatsApp Number", "Preferred Batch", "Created At"]
    const csvRows = [headers]

    filteredUsers.forEach((user) => {
      const row = [
        user.user_id,
        user.name,
        user.email,
        user.phone_number,
        user.whatsapp_number || "",
        user.preferred_batch ? getBatchLabel(user.preferred_batch) : "",
        new Date(user.created_at).toLocaleString(),
      ]
      csvRows.push(row)
    })

    // Convert to CSV string
    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "users.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToExcel = () => {
    // For simplicity, we'll just use CSV format with .xlsx extension
    // In a real app, you might want to use a library like xlsx to create actual Excel files
    const headers = ["User ID", "Name", "Email", "Phone Number", "WhatsApp Number", "Preferred Batch", "Created At"]
    const csvRows = [headers]

    filteredUsers.forEach((user) => {
      const row = [
        user.user_id,
        user.name,
        user.email,
        user.phone_number,
        user.whatsapp_number || "",
        user.preferred_batch ? getBatchLabel(user.preferred_batch) : "",
        new Date(user.created_at).toLocaleString(),
      ]
      csvRows.push(row)
    })

    // Convert to CSV string
    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "users.xlsx")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>View and edit user information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-6">
              <Search className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, phone, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {loading ? (
              <div className="text-center py-4">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-4">{searchQuery ? "No users match your search." : "No users found."}</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Preferred Batch</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.user_id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone_number}</TableCell>
                        <TableCell>{user.preferred_batch ? getBatchLabel(user.preferred_batch) : "Not set"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/users/edit/${user.id}`)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
