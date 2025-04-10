"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { BarChart3, BookOpen, LogOut, Menu, MessageSquare, Users, X, Upload, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if admin is authenticated using localStorage
    const adminAuth = localStorage.getItem("adminAuthenticated")
    console.log("Admin auth status:", adminAuth)

    if (adminAuth === "true") {
      setIsAuthenticated(true)
      setIsLoading(false)
    } else {
      console.log("Not authenticated, redirecting to login...")
      window.location.href = "/admin/login"
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated")
    window.location.href = "/"
  }

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: BarChart3 },
    { name: "Manage Courses", href: "/admin/courses", icon: BookOpen },
    { name: "Manage Users", href: "/admin/users", icon: Users },
    { name: "Bulk Registration", href: "/admin/bulk-registration", icon: Upload },
    { name: "Notifications", href: "/admin/notifications", icon: MessageSquare },
    { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  ]

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, don't render the layout
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-pattern">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="px-4 py-6 border-b">
            <Logo />
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-md",
                    isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100",
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-white" : "text-gray-500")} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t">
            <Button variant="outline" className="w-full flex items-center justify-center" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  )
}
