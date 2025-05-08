"use client"

import { AdminLayout } from "@/components/admin-layout"
import AddRandomReviews from "@/scripts/add-random-reviews"

export default function AddReviewsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Random Reviews</h1>
          <p className="text-muted-foreground">Generate and add random reviews to populate your database.</p>
        </div>

        <AddRandomReviews />
      </div>
    </AdminLayout>
  )
}
