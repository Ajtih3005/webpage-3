"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface LoginButtonProps {
  className?: string
  variant?: "default" | "outline" | "ghost" | "link"
}

export function LoginButton({ className, variant = "outline" }: LoginButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    setIsLoading(true)
    // Navigate to the login page
    router.push("/user/login")
  }

  return (
    <Button
      variant={variant}
      className={`backdrop-blur-sm bg-opacity-20 bg-white text-white border-white hover:bg-white hover:bg-opacity-30 transition-all ${className}`}
      onClick={handleLogin}
      disabled={isLoading}
    >
      {isLoading ? "Loading..." : "Login"}
    </Button>
  )
}
