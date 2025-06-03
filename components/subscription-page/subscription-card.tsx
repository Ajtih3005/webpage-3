"use client"

import { Button } from "@/components/ui/button"

interface SubscriptionCardProps {
  id: string
  name: string
  price: number
  duration_days: number
  features: string[]
  onSelect: (id: string) => void
}

export function SubscriptionCard({ id, name, price, duration_days, features, onSelect }: SubscriptionCardProps) {
  const formatDuration = (days: number) => {
    if (days === 30) return "1 Month"
    if (days === 90) return "3 Months"
    if (days === 365) return "1 Year"
    return `${days} Days`
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{name}</h3>
        <div className="text-3xl font-bold text-amber-600 mb-1">₹{price}</div>
        <div className="text-sm text-gray-600">{formatDuration(duration_days)}</div>
      </div>

      <div className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></div>
            <span className="text-sm text-gray-700">{feature}</span>
          </div>
        ))}
      </div>

      <Button onClick={() => onSelect(id)} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
        Select Plan
      </Button>
    </div>
  )
}
