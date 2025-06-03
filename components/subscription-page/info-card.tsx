import { cn } from "@/lib/utils"
import { Calendar, Clock, Globe, Gift, DollarSign, BookOpen, Users, Star, Award, Target } from "lucide-react"

interface InfoCardProps {
  icon: string
  title: string
  value: string
  className?: string
}

const iconMap = {
  calendar: Calendar,
  clock: Clock,
  globe: Globe,
  gift: Gift,
  dollar: DollarSign,
  book: BookOpen,
  users: Users,
  star: Star,
  award: Award,
  target: Target,
}

export function InfoCard({ icon, title, value, className }: InfoCardProps) {
  const IconComponent = iconMap[icon as keyof typeof iconMap] || Calendar

  return (
    <div className={cn("bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center space-x-3", className)}>
      <div className="flex-shrink-0">
        <IconComponent className="h-6 w-6 text-amber-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-900">{title}</p>
        <p className="text-lg font-semibold text-amber-800">{value}</p>
      </div>
    </div>
  )
}
