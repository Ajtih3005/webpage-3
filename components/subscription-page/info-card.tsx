import { Calendar, Clock, Globe, Gift, DollarSign, BarChart3, type LucideIcon } from "lucide-react"

interface InfoCardProps {
  icon: string
  title: string
  value: string
  className?: string
}

const iconMap: Record<string, LucideIcon> = {
  calendar: Calendar,
  clock: Clock,
  globe: Globe,
  gift: Gift,
  dollar: DollarSign,
  chart: BarChart3,
}

export function InfoCard({ icon, title, value, className = "" }: InfoCardProps) {
  const IconComponent = iconMap[icon] || Calendar

  return (
    <div className={`bg-amber-100 rounded-lg p-4 border border-amber-200 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <IconComponent className="w-6 h-6 text-amber-800" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-amber-800 mb-1">{title}</div>
          <div className="text-lg font-semibold text-amber-900">{value}</div>
        </div>
      </div>
    </div>
  )
}
