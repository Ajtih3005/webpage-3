"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Menu, X, LogOut } from "lucide-react"

interface UserLayoutProps {
  children: React.ReactNode
}

export function UserLayout({ children }: UserLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userName, setUserName] = useState("")

  useEffect(() => {
    // Check if user is authenticated via token
    const authToken = localStorage.getItem("authToken")
    const isAuthenticated = localStorage.getItem("userAuthenticated") === "true"

    if (!isAuthenticated) {
      router.push("/user/login")
      return
    }

    // Handle page visibility change (when user switches tabs or minimizes browser)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && authToken) {
        // User has switched away from the page
        // We'll set a timeout to log them out if they don't return quickly
        const logoutTimeout = setTimeout(
          async () => {
            try {
              // Call logout API
              await fetch("/api/logout", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ token: authToken }),
              })

              // Clear local storage
              localStorage.removeItem("userId")
              localStorage.removeItem("userName")
              localStorage.removeItem("userEmail")
              localStorage.removeItem("userPhone")
              localStorage.removeItem("userAuthenticated")
              localStorage.removeItem("authToken")
            } catch (error) {
              console.error("Error during auto-logout:", error)
            }
          },
          5 * 60 * 1000,
        ) // 5 minutes timeout

        // Store the timeout ID so we can clear it if the user comes back
        localStorage.setItem("logoutTimeoutId", logoutTimeout.toString())
      } else if (document.visibilityState === "visible") {
        // User has returned to the page, clear the logout timeout
        const timeoutId = localStorage.getItem("logoutTimeoutId")
        if (timeoutId) {
          clearTimeout(Number.parseInt(timeoutId))
          localStorage.removeItem("logoutTimeoutId")
        }
      }
    }

    // Add event listener for visibility change
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Cleanup function
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      const timeoutId = localStorage.getItem("logoutTimeoutId")
      if (timeoutId) {
        clearTimeout(Number.parseInt(timeoutId))
        localStorage.removeItem("logoutTimeoutId")
      }
    }
  }, [router])

  useEffect(() => {
    const userId = localStorage.getItem("userId")
    const name = localStorage.getItem("userName")
    setIsAuthenticated(!!userId)
    setUserName(name || "Yoga Practitioner")

    if (!userId) {
      router.push("/user/login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("userId")
    router.push("/user/login")
  }

  if (!isAuthenticated) {
    return null
  }

  const navItems = [
    { href: "/user/dashboard", label: "Dashboard", icon: "grid" },
    { href: "/user/access-course", label: "Access Course", icon: "calendar" },
    { href: "/user/documents", label: "Documents", icon: "file-text" },
    { href: "/user/previous-sessions", label: "Previous Sessions", icon: "clock" },
    { href: "/user/subscriptions", label: "Subscriptions", icon: "credit-card" },
    { href: "/user/notifications", label: "Notifications", icon: "bell" },
    { href: "/user/reviews", label: "Reviews", icon: "star" },
    { href: "/user/profile", label: "Profile", icon: "user" },
    { href: "/user/contact", label: "Contact Us", icon: "mail" },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar - Always visible on desktop */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
            {/* User welcome */}
            <div className="px-4 py-4 mb-4 bg-green-50">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-medium">
                  {userName.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Welcome,</p>
                  <p className="text-sm text-green-700 truncate">{userName}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col flex-grow px-4">
              <div className="flex-grow">
                <nav className="flex-1 space-y-1">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                          pathname === item.href
                            ? "bg-green-600 text-white"
                            : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                        }`}
                      >
                        <span className="mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
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
                            {item.icon === "calendar" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            )}
                            {item.icon === "file-text" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            )}
                            {item.icon === "clock" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
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
                            {item.icon === "star" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                              />
                            )}
                            {item.icon === "user" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            )}
                            {item.icon === "mail" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            )}
                          </svg>
                        </span>
                        {item.label}
                        {pathname === item.href && (
                          <span className="ml-auto">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="flex-shrink-0 p-4 mt-6">
                <Button variant="outline" className="w-full flex items-center justify-center" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu - Visible when toggled */}
        <div className={`md:hidden fixed inset-0 flex z-40 ${isMobileMenuOpen ? "" : "pointer-events-none"}`}>
          <div
            className={`fixed inset-0 bg-gray-600 transition-opacity ease-in-out duration-300 ${
              isMobileMenuOpen ? "opacity-75" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          <div
            className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition ease-in-out duration-300 ${
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              {/* User welcome - mobile */}
              <div className="px-4 py-4 mb-4 bg-green-50">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-medium">
                    {userName.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">Welcome,</p>
                    <p className="text-sm text-green-700 truncate">{userName}</p>
                  </div>
                </div>
              </div>

              <nav className="px-4 space-y-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                        pathname === item.href
                          ? "bg-green-600 text-white"
                          : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
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
                          {item.icon === "calendar" && (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          )}
                          {item.icon === "file-text" && (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          )}
                          {item.icon === "clock" && (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
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
                          {item.icon === "star" && (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          )}
                          {item.icon === "user" && (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          )}
                          {item.icon === "mail" && (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          )}
                        </svg>
                      </span>
                      {item.label}
                      {pathname === item.href && (
                        <span className="ml-auto">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
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
              <Button
                variant="ghost"
                size="icon"
                className="text-green-700 hover:bg-green-50"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-green-100 py-6 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <Logo />
                <span className="ml-2 text-lg font-semibold text-green-800">Sthavishtah Yoga</span>
              </div>
              <div className="text-sm text-gray-500">
                <p>© 2023 Sthavishtah Yoga. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
