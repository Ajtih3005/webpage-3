"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Menu, LogOut, PiIcon as ApiIcon, Star, Send } from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
}

function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const adminAuth = localStorage.getItem("adminAuthenticated")
    setIsAuthenticated(adminAuth === "true")

    if (adminAuth !== "true") {
      router.push("/admin/login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated")
    router.push("/admin/login")
  }

  if (!isAuthenticated) {
    return null
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "grid" },
    { href: "/admin/courses", label: "Courses", icon: "book-open" },
    { href: "/admin/users", label: "Users", icon: "users" },
    { href: "/admin/instructors", label: "Instructors", icon: "user" },
    { href: "/admin/subscriptions", label: "Subscriptions", icon: "credit-card" },
    { href: "/admin/link-generator", label: "Link Generator", icon: "link" },
    { href: "/admin/payment-recovery", label: "Payment Recovery", icon: "refresh-cw" },
    { href: "/admin/notifications", label: "Notifications", icon: "bell" },
    { href: "/admin/documents", label: "Documents", icon: "file-text" },
    { href: "/admin/analytics/video", label: "Analytics", icon: "bar-chart" },
    { href: "/admin/updates", label: "Updates", icon: "refresh-cw" },
    { href: "/admin/contact", label: "Contact", icon: "mail" },
    { href: "/admin/email", label: "Send Email", icon: "send" },
    { href: "/admin/api-verification", label: "API Verification", icon: ApiIcon },
    { href: "/admin/reviews", label: "Reviews", icon: Star },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar - Always visible on desktop */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
            <div className="flex items-center flex-shrink-0 px-4">
              <Logo />
              <span className="ml-2 text-xl font-semibold text-gray-800">Admin</span>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 pb-4 space-y-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        pathname === item.href
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <span className="mr-3 flex-shrink-0 h-6 w-6">
                        {item.icon === "send" && <Send className="h-6 w-6" />}
                        {item.icon !== "send" && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            {item.icon === "grid" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                              />
                            )}
                            {item.icon === "book-open" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                              />
                            )}
                            {item.icon === "users" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                              />
                            )}
                            {item.icon === "credit-card" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            )}
                            {item.icon === "bell" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                              />
                            )}
                            {item.icon === "file-text" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            )}
                            {item.icon === "bar-chart" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            )}
                            {item.icon === "refresh-cw" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            )}
                            {item.icon === "mail" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            )}
                            {item.icon === "star" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.412 5.518.442a.562.562 0 01.494.944l-3.903 3.255.719 5.504a.562.562 0 01-.815.583l-4.774-2.877-4.774 2.877a.562.562 0 01-.814-.583l.719-5.504-3.903-3.255a.562.562 0 01.494-.944l5.518-.442 2.125-5.412z"
                              />
                            )}
                            {item.icon === "link" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 001.242 7.244"
                              />
                            )}
                            {item.icon === "user" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                              />
                            )}
                          </svg>
                        )}
                      </span>
                      {item.label}
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 p-4">
              <Button variant="outline" className="w-full flex items-center justify-center" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Mobile header - Always visible on mobile */}
          <div className="md:hidden bg-white border-b p-4 sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <Logo />
              <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

// Export both as default and named export to support both import styles
export default AdminLayout
export { AdminLayout }
