import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, Info, Package } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"

async function getSubscriptions() {
  const supabase = getSupabaseBrowserClient()
  // Removed the is_active filter since that column doesn't exist
  const { data, error } = await supabase.from("subscriptions").select("*").order("price", { ascending: true })

  if (error) {
    console.error("Error fetching subscriptions:", error)
    return []
  }

  return data || []
}

async function getUpdates() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("updates").select("*").order("created_at", { ascending: false }).limit(5)

  if (error) {
    console.error("Error fetching updates:", error)
    return []
  }

  return data || []
}

export default async function Updates() {
  const subscriptions = await getSubscriptions()
  const updates = await getUpdates()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full bg-white py-3 px-4 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center">
          <div className="relative h-10 w-10 mr-3">
            <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" priority />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight">STHAVISHTAH</span>
            <span className="text-xs tracking-widest text-muted-foreground">YOGA AND WELLNESS</span>
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-100 text-purple-700 border-purple-200 font-medium"
            >
              <Link href="/user/login">Login</Link>
            </Button>
            <Button asChild size="sm" className="bg-purple-700 hover:bg-purple-800 text-white font-medium">
              <Link href="/user/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button asChild variant="ghost" size="sm" className="mr-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Subscriptions & Updates</h1>
        </div>

        {/* Subscription Plans Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Package className="mr-2 h-5 w-5 text-purple-600" />
            Available Subscription Plans
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {subscriptions.length > 0 ? (
              subscriptions.map((subscription) => (
                <Card key={subscription.id} className="overflow-hidden border-t-4 border-t-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle>{subscription.name}</CardTitle>
                    <CardDescription>{subscription.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{formatCurrency(subscription.price)}</div>
                    <p className="text-sm text-muted-foreground mb-4">{subscription.duration_days} days</p>

                    <ul className="space-y-2 text-sm">
                      {subscription.features?.split(",").map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {feature.trim()}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href="/user/login?redirect=subscriptions">Subscribe Now</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center p-8 bg-gray-100 rounded-lg">
                <p>No subscription plans available at the moment. Please check back later.</p>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              To purchase a subscription, you need to register or login to your account.
            </p>
          </div>
        </section>

        {/* Latest Updates Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Info className="mr-2 h-5 w-5 text-purple-600" />
            Latest Updates
          </h2>

          <div className="space-y-4">
            {updates.length > 0 ? (
              updates.map((update) => (
                <Card key={update.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle>{update.title}</CardTitle>
                      <Badge
                        className={`
                          ${update.type === "schedule" ? "bg-blue-100 text-blue-800" : ""}
                          ${update.type === "system" ? "bg-amber-100 text-amber-800" : ""}
                          ${update.type === "course" ? "bg-green-100 text-green-800" : ""}
                          ${update.type === "announcement" ? "bg-purple-100 text-purple-800" : ""}
                        `}
                      >
                        {update.type}
                      </Badge>
                    </div>
                    <CardDescription>{new Date(update.created_at).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{update.content}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center p-8 bg-gray-100 rounded-lg">
                <p>No updates available at the moment. Please check back later.</p>
              </div>
            )}
          </div>
        </section>

        <div className="mt-12 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <Bell className="mr-2 h-5 w-5 text-purple-600" />
                Ready to Join?
              </CardTitle>
              <CardDescription>
                Register or login to subscribe and access all our yoga and wellness content
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4 justify-center">
              <Button asChild variant="outline">
                <Link href="/user/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/user/register">Register Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} STHAVISHTAH YOGA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
