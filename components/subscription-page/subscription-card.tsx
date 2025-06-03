"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Check } from "lucide-react"

interface SubscriptionCardProps {
  id: number
  name: string
  price: number
  duration_days: number
  features: string[]
  discount?: number
  isPopular?: boolean
  onSelect: (id: number) => void
}

export function SubscriptionCard({
  id,
  name,
  price,
  duration_days,
  features,
  discount,
  isPopular,
  onSelect,
}: SubscriptionCardProps) {
  const discountedPrice = discount ? price - (price * discount) / 100 : price
  const durationText =
    duration_days >= 365
      ? `${Math.floor(duration_days / 365)} Year${Math.floor(duration_days / 365) > 1 ? "s" : ""}`
      : duration_days >= 30
        ? `${Math.floor(duration_days / 30)} Month${Math.floor(duration_days / 30) > 1 ? "s" : ""}`
        : `${duration_days} Days`

  return (
    <Card className={`relative ${isPopular ? "border-amber-500 shadow-lg" : "border-gray-200"}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium">Most Popular</span>
        </div>
      )}

      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold text-gray-900">{name}</CardTitle>
        <div className="mt-2">
          {discount && <span className="text-sm text-gray-500 line-through">{formatCurrency(price)}</span>}
          <div className="text-3xl font-bold text-gray-900">{formatCurrency(discountedPrice)}</div>
          <p className="text-sm text-gray-600">{durationText}</p>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start space-x-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button onClick={() => onSelect(id)} className={`w-full ${isPopular ? "bg-amber-600 hover:bg-amber-700" : ""}`}>
          Select Plan
        </Button>
      </CardFooter>
    </Card>
  )
}
