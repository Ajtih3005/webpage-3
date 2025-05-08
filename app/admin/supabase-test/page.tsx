import SupabaseConnectionTest from "@/components/supabase-connection-test"
import AdminLayout from "@/components/admin-layout"

export default function SupabaseTestPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
        <p className="mb-6 text-gray-600">Use this page to test your Supabase connection and diagnose any issues.</p>

        <SupabaseConnectionTest />
      </div>
    </AdminLayout>
  )
}
