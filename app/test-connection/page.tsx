import { SupabaseTest } from "@/components/supabase-test"

export default function TestConnectionPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      <SupabaseTest />
    </div>
  )
}
