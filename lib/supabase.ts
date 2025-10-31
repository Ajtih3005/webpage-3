import { createClient as supabaseCreateClient } from "@supabase/supabase-js"

// For main app (authentication, courses, payments, etc.)
export const getSupabaseBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Main Supabase URL:", supabaseUrl ? "✅ Set" : "❌ Missing")
  console.log("[v0] Main Supabase Key:", supabaseAnonKey ? "✅ Set" : "❌ Missing")

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Main Supabase URL and anon key must be defined for authentication")
  }

  return supabaseCreateClient(supabaseUrl, supabaseAnonKey)
}

// For server-side usage (main database)
export const getSupabaseServerClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Server Supabase URL:", supabaseUrl ? "✅ Set" : "❌ Missing")
  console.log("[v0] Server Supabase Key:", supabaseAnonKey ? "✅ Set" : "❌ Missing")

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Main Supabase URL and anon key must be defined for server operations")
  }

  return supabaseCreateClient(supabaseUrl, supabaseAnonKey)
}

// Default client (main database)
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Main Supabase URL and anon key must be defined")
  }

  return supabaseCreateClient(supabaseUrl, supabaseAnonKey)
}
