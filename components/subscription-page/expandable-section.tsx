"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExpandableSectionProps {
  title: string
  content: string
  defaultExpanded?: boolean
  className?: string
}

export function ExpandableSection({ title, content, defaultExpanded = false, className }: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className={cn("bg-amber-50 border border-amber-200 rounded-lg overflow-hidden", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-amber-100 transition-colors"
      >
        <h3 className="text-lg font-medium text-amber-900">{title}</h3>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-amber-700" />
        ) : (
          <ChevronDown className="h-5 w-5 text-amber-700" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-4">
          <div className="text-amber-800 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      )}
    </div>
  )
}
