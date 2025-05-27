import { createClient as supabaseCreateClient, type SupabaseClient } from "@supabase/supabase-js"

// For client-side usage
export const getSupabaseBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL and anon key must be defined")
    // Return a mock client for preview environments
    return createMockClient()
  }

  try {
    return supabaseCreateClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn("Failed to create Supabase client:", error)
    return createMockClient()
  }
}

// For server-side usage
export const getSupabaseServerClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL and anon key must be defined")
    return createMockClient()
  }

  try {
    return supabaseCreateClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn("Failed to create Supabase server client:", error)
    return createMockClient()
  }
}

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL and anon key must be defined")
    return createMockClient()
  }

  try {
    return supabaseCreateClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn("Failed to create Supabase client:", error)
    return createMockClient()
  }
}

// Mock client for preview environments
function createMockClient(): SupabaseClient {
  return {
    from: (table: string) => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: null } }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
      }),
    },
    rpc: () => Promise.resolve({ data: null, error: null }),
  } as any
}
