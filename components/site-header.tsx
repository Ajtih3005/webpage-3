"use client"

import type React from "react"

import { LoginButton } from "@/components/login-button"
import { navigateToHome } from "@/lib/auth-client"

export default function SiteHeader() {
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // 🏠 Navigate to home WITHOUT logout
    navigateToHome()
  }

  return (
    <header className="bg-gray-100 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <button
          onClick={handleLogoClick}
          className="text-2xl font-bold hover:text-green-600 transition-colors cursor-pointer"
        >
          My App
        </button>
        <nav>
          <ul className="flex items-center space-x-4">
            <li>
              <a href="/about">About</a>
            </li>
            <li>
              <a href="/contact">Contact</a>
            </li>
            <li>
              <LoginButton className="ml-4" />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
