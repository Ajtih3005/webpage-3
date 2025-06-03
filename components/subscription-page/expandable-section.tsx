"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface ExpandableSectionProps {
  title: string
  content: string
  defaultExpanded?: boolean
}

export function ExpandableSection({ title, content, defaultExpanded = false }: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="bg-amber-100 rounded-lg border border-amber-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-amber-50 transition-colors"
      >
        <span className="text-lg font-medium text-amber-900">{title}</span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-amber-700" />
        ) : (
          <ChevronDown className="w-5 h-5 text-amber-700" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-4 border-t border-amber-200">
          <div className="text-amber-800 leading-relaxed pt-4" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      )}
    </div>
  )
}
