import { notFound } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { SubscriptionDetails } from "@/components/subscription/subscription-details"

interface SubscriptionPageProps {
  params: {
    id: string
  }
}

const SubscriptionPage = async ({ params }: SubscriptionPageProps) => {
  const user = await currentUser()

  if (!user) {
    return redirect("/")
  }

  const subscription = await db.subscription.findUnique({
    where: {
      id: params.id,
    },
    include: {
      plan: true,
      user: true,
    },
  })

  if (!subscription) {
    return notFound()
  }

  if (subscription.userId !== user.id) {
    // Check if the user is an admin.  If not, redirect.
    const dbUser = await db.user.findUnique({
      where: {
        id: user.id,
      },
    })

    if (!dbUser?.isAdmin) {
      return redirect("/instructor/subscriptions")
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="rounded-md border bg-muted p-4 mb-4">
        <p className="text-sm text-muted-foreground">
          This subscription is managed by an administrator. You have read-only access.
        </p>
      </div>
      <SubscriptionDetails subscription={subscription} readOnly={true} />
    </div>
  )
}

export default SubscriptionPage
