"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Users,
  Settings,
  BarChart3,
  FileText,
  CreditCard,
  Mail,
  Database,
  LogOut,
  Menu,
  Home,
  Package,
  UserPlus,
  MessageSquare,
  BookOpen,
  Shield,
  Bell,
  ChevronDown,
  LinkIcon,
  UserCheck,
  PlayCircle,
  DollarSign,
  RefreshCw,
  TestTube,
  Layers,
  Eye,
  Plus,
  Send,
  Star,
  ExternalLink,
} from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
}

function AdminLayout({ children }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    try {
      // Check if we're on the client side
      if (typeof window === "undefined") {
        setLoading(false)
        return
      }

      // Use the same authentication method as login page
      const adminPassword = localStorage.getItem("adminPassword")

      if (!adminPassword) {
        router.push("/admin/login")
        return
      }

      // Verify the password is correct - same logic as login
      const validPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"

      if (adminPassword === validPassword) {
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem("adminPassword")
        router.push("/admin/login")
        return
      }
    } catch (error) {
      console.error("Authentication check failed:", error)
      router.push("/admin/login")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminPassword")
    }
    router.push("/admin/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: Home,
      description: "Overview and analytics",
    },
    {
      title: "User Management",
      icon: Users,
      items: [
        { title: "All Users", href: "/admin/users", icon: Users },
        { title: "Bulk Registration", href: "/admin/bulk-registration", icon: UserPlus },
      ],
    },
    {
      title: "Subscription Management",
      icon: Package,
      items: [
        { title: "All Subscriptions", href: "/admin/subscriptions", icon: Package },
        { title: "Create Subscription", href: "/admin/subscriptions/create", icon: Plus },
        { title: "Activate Subscriptions", href: "/admin/subscriptions/activate", icon: UserCheck },
        { title: "Free Subscriptions", href: "/admin/free-subscriptions", icon: Package },
      ],
    },
    {
      title: "Course Management",
      icon: BookOpen,
      items: [
        { title: "All Courses", href: "/admin/courses", icon: BookOpen },
        { title: "Create Course", href: "/admin/courses/create", icon: Plus },
      ],
    },
    {
      title: "Instructor Management",
      icon: UserCheck,
      items: [
        { title: "All Instructors", href: "/admin/instructors", icon: UserCheck },
        { title: "Create Instructor", href: "/admin/instructors/create", icon: Plus },
      ],
    },
    {
      title: "Content & Reviews",
      icon: Star,
      items: [
        { title: "Reviews", href: "/admin/reviews", icon: Star },
        { title: "Add Reviews", href: "/admin/add-reviews", icon: Plus },
        { title: "Auto Insert Reviews", href: "/admin/auto-insert-reviews", icon: RefreshCw },
        { title: "Make Reviews Visible", href: "/admin/make-reviews-visible", icon: Eye },
      ],
    },
    {
      title: "Communication",
      icon: Mail,
      items: [
        { title: "Email Management", href: "/admin/email", icon: Mail },
        { title: "Email Configuration", href: "/admin/email-config", icon: Settings },
        { title: "Email Setup", href: "/admin/email-setup", icon: Settings },
        { title: "Test Email", href: "/admin/email-test", icon: TestTube },
        { title: "Send Course Links", href: "/admin/send-course-links", icon: Send },
        { title: "Contact Messages", href: "/admin/contact", icon: MessageSquare },
        { title: "Notifications", href: "/admin/notifications", icon: Bell },
      ],
    },
    {
      title: "Analytics & Reports",
      icon: BarChart3,
      items: [
        { title: "Video Analytics", href: "/admin/analytics/video", icon: PlayCircle },
        { title: "Payment Recovery", href: "/admin/payment-recovery", icon: DollarSign },
      ],
    },
    {
      title: "Tools & Utilities",
      icon: Settings,
      items: [
        { title: "Link Generator", href: "/admin/link-generator", icon: LinkIcon },
        { title: "Direct Access", href: "/admin/direct-access", icon: ExternalLink },
        { title: "Documents", href: "/admin/documents", icon: FileText },
        { title: "Database Management", href: "/admin/database", icon: Database },
        { title: "API Verification", href: "/admin/api-verification", icon: Shield },
      ],
    },
    {
      title: "Payment & Testing",
      icon: CreditCard,
      items: [
        { title: "Razorpay Test", href: "/admin/razorpay-test", icon: TestTube },
        { title: "Razorpay Amount Test", href: "/admin/razorpay-amount-test", icon: TestTube },
      ],
    },
    {
      title: "System",
      icon: Settings,
      items: [
        { title: "Updates", href: "/admin/updates", icon: RefreshCw },
        { title: "Subscription Pages", href: "/admin/subscription-pages", icon: Layers },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            ×
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item, index) => (
            <div key={index}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.title}
                </Link>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.title}
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {item.items?.map((subItem, subIndex) => (
                      <DropdownMenuItem key={subIndex} asChild>
                        <Link href={subItem.href} className="flex items-center" onClick={() => setSidebarOpen(false)}>
                          <subItem.icon className="w-4 h-4 mr-2" />
                          {subItem.title}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t">
          <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-6 bg-white border-b lg:px-8">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Admin Access
            </Badge>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

// Export as default
export default AdminLayout

// Also export as named export for compatibility
export { AdminLayout }
