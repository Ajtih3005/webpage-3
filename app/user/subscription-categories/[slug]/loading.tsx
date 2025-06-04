import { UserLayout } from "@/components/user-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CategoryDetailLoading() {
  return (
    <UserLayout>
      <div className="container mx-auto py-6">
        {/* Back Button Skeleton */}
        <Skeleton className="h-10 w-32 mb-6" />

        {/* Hero Section Skeleton */}
        <div className="relative h-64 md:h-80 mb-8 rounded-lg overflow-hidden">
          <Skeleton className="w-full h-full" />
        </div>

        {/* Introduction Skeleton */}
        <div className="mb-8 text-center max-w-4xl mx-auto">
          <Skeleton className="h-8 w-96 mx-auto mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>

        {/* Info Cards Skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="text-center p-6">
              <Skeleton className="h-6 w-6 mx-auto mb-3" />
              <Skeleton className="h-6 w-20 mx-auto mb-2" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </Card>
          ))}
        </div>

        {/* Content Sections Skeleton */}
        <div className="mb-8 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mx-auto mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <Skeleton className="h-6 w-64" />
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Plans Skeleton */}
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-48 mx-auto mb-6" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-2 bg-gray-200 w-full"></div>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-8 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-32 mb-3" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="flex items-start">
                        <Skeleton className="h-5 w-5 mr-2 shrink-0" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
