"use client"

import React from "react"

import type { ReactNode } from "react"
import { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  UserPlus,
  Mail,
  Database,
  TestTube,
  FileText,
  MessageSquare,
  BarChart3,
  LinkIcon,
  Star,
  DollarSign,
  Bell,
  Shield,
  Zap,
  RefreshCw,
  Activity,
  Package,
  GraduationCap,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface AdminLayoutProps {
  children: ReactNode
}

interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  children?: NavItem[]
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    icon: Users,
    children: [
      { title: "All Users", href: "/admin/users", icon: Users },
      { title: "Bulk Registration", href: "/admin/bulk-registration", icon: UserPlus },
    ],
  },
  {
    title: "Courses",
    icon: BookOpen,
    children: [
      { title: "All Courses", href: "/admin/courses", icon: BookOpen },
      { title: "Create Course", href: "/admin/courses/create", icon: BookOpen },
    ],
  },
  {
    title: "Subscriptions",
    icon: CreditCard,
    children: [
      { title: "All Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
      { title: "Create Subscription", href: "/admin/subscriptions/create", icon: CreditCard },
      { title: "Subscription Pages", href: "/admin/subscription-pages", icon: Package },
    ],
  },
  {
    title: "Instructors",
    icon: GraduationCap,
    children: [
      { title: "All Instructors", href: "/admin/instructors", icon: GraduationCap },
      { title: "Create Instructor", href: "/admin/instructors/create", icon: GraduationCap },
    ],
  },
  {
    title: "Analytics",
    icon: BarChart3,
    children: [
      { title: "Video Analytics", href: "/admin/analytics/video", icon: BarChart3 },
      { title: "Payment Recovery", href: "/admin/payment-recovery", icon: DollarSign },
    ],
  },
  {
    title: "Communications",
    icon: Mail,
    children: [
      { title: "Email Management", href: "/admin/email", icon: Mail },
      { title: "Email Configuration", href: "/admin/email-config", icon: Settings },
      { title: "Email Setup", href: "/admin/email-setup", icon: Settings },
      { title: "Test Email", href: "/admin/email-test", icon: TestTube },
      { title: "Notifications", href: "/admin/notifications", icon: Bell },
      { title: "Contact Messages", href: "/admin/contact", icon: MessageSquare },
    ],
  },
  {
    title: "Reviews",
    icon: Star,
    children: [
      { title: "All Reviews", href: "/admin/reviews", icon: Star },
      { title: "Add Reviews", href: "/admin/add-reviews", icon: Star },
      { title: "Insert Reviews", href: "/admin/insert-reviews", icon: Star },
      { title: "Auto Insert Reviews", href: "/admin/auto-insert-reviews", icon: Zap },
      { title: "Make Reviews Visible", href: "/admin/make-reviews-visible", icon: Star },
    ],
  },
  {
    title: "Tools",
    icon: Settings,
    children: [
      { title: "Link Generator", href: "/admin/link-generator", icon: LinkIcon },
      { title: "Direct Access", href: "/admin/direct-access", icon: Shield },
      { title: "Send Course Links", href: "/admin/send-course-links", icon: LinkIcon },
      { title: "Documents", href: "/admin/documents", icon: FileText },
      { title: "Updates", href: "/admin/updates", icon: RefreshCw },
    ],
  },
  {
    title: "System",
    icon: Database,
    children: [
      { title: "Database", href: "/admin/database", icon: Database },
      { title: "API Verification", href: "/admin/api-verification", icon: TestTube },
      { title: "Razorpay Test", href: "/admin/razorpay-test", icon: TestTube },
      { title: "Razorpay Amount Test", href: "/admin/razorpay-amount-test", icon: TestTube },
      { title: "Supabase Test", href: "/admin/supabase-test", icon: TestTube },
      { title: "Debug Subscriptions", href: "/admin/debug-subscriptions", icon: Activity },
      { title: "Fix Subscription Days", href: "/admin/fix-subscription-days", icon: RefreshCw },
    ],
  },
]

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [openSections, setOpenSections] = useState<string[]>([])

  // Use useCallback to memoize handleLogout
  const handleLogout = useCallback(() => {
    localStorage.removeItem("adminPassword")
    router.push("/admin/login")
  }, [router])

  // Use useCallback to memoize toggleSection
  const toggleSection = useCallback((title: string) => {
    setOpenSections((prev) => (prev.includes(title) ? prev.filter((section) => section !== title) : [...prev, title]))
  }, [])

  // Use useCallback to memoize isActive
  const isActive = useCallback(
    (href: string) => {
      return pathname === href || pathname.startsWith(href + "/")
    },
    [pathname],
  )

  // Use useCallback to memoize isSectionActive
  const isSectionActive = useCallback(
    (item: NavItem): boolean => {
      if (item.href) {
        return isActive(item.href)
      }
      if (item.children) {
        return item.children.some((child) => child.href && isActive(child.href))
      }
      return false
    },
    [isActive],
  )

  // Auto-expand active sections
  useEffect(() => {
    navigation.forEach((item) => {
      if (isSectionActive(item) && !openSections.includes(item.title)) {
        setOpenSections((prev) => [...prev, item.title])
      }
    })
  }, [pathname, isSectionActive, openSections])

  // Perform authentication check only once on initial load
  useEffect(() => {
    const checkAuth = () => {
      const storedPassword = localStorage.getItem("adminPassword")
      const envPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

      if (storedPassword && envPassword && storedPassword === envPassword) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        router.push("/admin/login")
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  const NavContent = React.memo(() => (
    <div className="space-y-2">
      {navigation.map((item) => {
        if (item.children) {
          const isOpen = openSections.includes(item.title)
          const isItemActive = isSectionActive(item)

          return (
            <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleSection(item.title)}>
              <CollapsibleTrigger asChild>
                <Button
                  variant={isItemActive ? "secondary" : "ghost"}
                  className={`w-full justify-between ${
                    isItemActive
                      ? "bg-green-100 text-green-800"
                      : "text-gray-700 hover:text-green-800 hover:bg-green-50"
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 ml-4">
                {item.children.map((child) => (
                  <Link key={child.href} href={child.href!}>
                    <Button
                      variant={isActive(child.href!) ? "secondary" : "ghost"}
                      size="sm"
                      className={`w-full justify-start ${
                        isActive(child.href!)
                          ? "bg-green-100 text-green-800"
                          : "text-gray-600 hover:text-green-800 hover:bg-green-50"
                      }`}
                    >
                      <child.icon className="mr-2 h-3 w-3" />
                      {child.title}
                      {child.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {child.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )
        }

        return (
          <Link key={item.href} href={item.href!}>
            <Button
              variant={isActive(item.href!) ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                isActive(item.href!)
                  ? "bg-green-100 text-green-800"
                  : "text-gray-700 hover:text-green-800 hover:bg-green-50"
              }`}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
              {item.badge && (
                <Badge variant="secondary" className="ml-2">
                  {item.badge}
                </Badge>
              )}
            </Button>
          </Link>
        )
      })}
    </div>
  ))

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Admin Panel</p>
                <p className="text-xs text-gray-500">Sthavishtah Yoga</p>
              </div>
            </div>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <ScrollArea className="flex-1 px-3">
              <NavContent />
            </ScrollArea>
            <div className="flex-shrink-0 p-3 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 bg-transparent"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed top-4 left-4 z-40 bg-transparent">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center px-4 py-5 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Admin Panel</p>
                  <p className="text-xs text-gray-500">Sthavishtah Yoga</p>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1 px-3 py-3">
              <NavContent />
            </ScrollArea>
            <div className="flex-shrink-0 p-3 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 bg-transparent"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}

export { AdminLayout }
export default AdminLayout
