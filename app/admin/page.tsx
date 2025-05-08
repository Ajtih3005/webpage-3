import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { Star, Plus, Settings } from "lucide-react"

export default function AdminOptions() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <CardDescription>Choose the type of admin access you need</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Button asChild size="lg" className="h-20">
                <Link href="/admin/live/login">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-lg font-semibold">Live Session Admin</span>
                    <span className="text-xs text-gray-100">Host and manage live sessions</span>
                  </div>
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline" className="h-20">
                <Link href="/admin/login">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-lg font-semibold">Settings Admin</span>
                    <span className="text-xs text-gray-500">Manage users, courses and platform settings</span>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            {/* Add Reviews Card - HIGHLIGHTED */}
            <Card className="border-2 border-green-500 bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Star className="h-5 w-5 mr-2 text-green-600" />
                  Add 43 Reviews
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-green-700">Automatically add 43 random reviews to your homepage</p>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/admin/auto-insert-reviews" className="w-full">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Plus className="mr-2 h-4 w-4" /> Add Reviews Now
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Other quick actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-gray-600" />
                  Other Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600">Manage other platform settings</p>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/admin/settings" className="w-full">
                  <Button variant="outline" className="w-full">
                    Manage Settings
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </CardContent>
        </Card>

        <CardFooter className="justify-center p-0">
          <Button asChild variant="ghost">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardFooter>
      </div>
    </div>
  )
}
