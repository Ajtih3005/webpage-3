"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, User, LogOut, Home, Book, Bell } from "lucide-react"
import { checkUserSession, logoutUser } from "@/lib/auth-client"

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { loggedIn, user } = await checkUserSession()
      setIsLoggedIn(loggedIn)

      if (loggedIn && user?.email) {
        setUserEmail(user.email)
      } else {
        // Try to get from localStorage as fallback
        const email = localStorage.getItem("userEmail")
        if (email) setUserEmail(email)
      }
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    const { success } = await logoutUser()
    if (success) {
      setIsLoggedIn(false)
      setUserEmail(null)
      router.push("/user/login")
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo - Now clickable and redirects to home */}
          <Link href="/" className="flex items-center">
            <div className="relative h-10 w-10 mr-2 overflow-hidden rounded-full border-2 border-green-100">
              <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-800">
                Sthavishtah
              </span>
              <span className="text-xs text-gray-600 -mt-1">Yoga & Wellness</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-green-600 transition-colors">
              Home
            </Link>
            <Link href="/plans" className="text-gray-700 hover:text-green-600 transition-colors">
              Plans
            </Link>
            <Link href="/user/contact" className="text-gray-700 hover:text-green-600 transition-colors">
              Contact
            </Link>

            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Link href="/user/dashboard" className="text-gray-700 hover:text-green-600 transition-colors">
                  Dashboard
                </Link>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{userEmail}</span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/user/register">
                  <Button variant="outline" size="sm">
                    Register
                  </Button>
                </Link>
                <Link href="/user/login">
                  <Button size="sm">Login</Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-3 pt-4">
              <Link
                href="/"
                className="flex items-center px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="h-4 w-4 mr-3" />
                Home
              </Link>

              <Link
                href="/plans"
                className="flex items-center px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Book className="h-4 w-4 mr-3" />
                Plans
              </Link>

              <Link
                href="/user/contact"
                className="flex items-center px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bell className="h-4 w-4 mr-3" />
                Contact
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/user/dashboard"
                    className="flex items-center px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Dashboard
                  </Link>

                  <div className="px-3 py-2 text-sm text-gray-600 border-t border-gray-200 mt-2 pt-4">
                    Logged in as: {userEmail}
                  </div>

                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors w-full text-left"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 px-3 pt-2 border-t border-gray-200 mt-2">
                  <Link href="/user/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Register
                    </Button>
                  </Link>
                  <Link href="/user/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Login</Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
