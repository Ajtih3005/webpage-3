import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting utility
export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Date formatting utility
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === "string" ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }

  return new Intl.DateTimeFormat("en-US", options || defaultOptions).format(dateObj)
}

// Batch label generator
export function getBatchLabel(batchNumber: number, year?: number): string {
  const currentYear = year || new Date().getFullYear()
  return `Batch ${batchNumber.toString().padStart(2, "0")} - ${currentYear}`
}

// User ID generator
export function generateUserId(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `user_${timestamp}_${randomStr}`
}

// Countries list
export const countries = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "NL", name: "Netherlands" },
  { code: "CH", name: "Switzerland" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "NZ", name: "New Zealand" },
  { code: "IE", name: "Ireland" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" },
  { code: "ZA", name: "South Africa" },
  { code: "EG", name: "Egypt" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "GH", name: "Ghana" },
  { code: "CN", name: "China" },
  { code: "KR", name: "South Korea" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "ID", name: "Indonesia" },
  { code: "MY", name: "Malaysia" },
  { code: "PH", name: "Philippines" },
  { code: "BD", name: "Bangladesh" },
  { code: "PK", name: "Pakistan" },
  { code: "LK", name: "Sri Lanka" },
  { code: "NP", name: "Nepal" },
  { code: "MM", name: "Myanmar" },
  { code: "KH", name: "Cambodia" },
  { code: "LA", name: "Laos" },
  { code: "RU", name: "Russia" },
  { code: "UA", name: "Ukraine" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czech Republic" },
  { code: "HU", name: "Hungary" },
  { code: "RO", name: "Romania" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "SI", name: "Slovenia" },
  { code: "SK", name: "Slovakia" },
  { code: "LT", name: "Lithuania" },
  { code: "LV", name: "Latvia" },
  { code: "EE", name: "Estonia" },
  { code: "TR", name: "Turkey" },
  { code: "GR", name: "Greece" },
  { code: "CY", name: "Cyprus" },
  { code: "MT", name: "Malta" },
  { code: "IS", name: "Iceland" },
  { code: "LU", name: "Luxembourg" },
  { code: "MC", name: "Monaco" },
  { code: "AD", name: "Andorra" },
  { code: "SM", name: "San Marino" },
  { code: "VA", name: "Vatican City" },
  { code: "LI", name: "Liechtenstein" },
  { code: "IL", name: "Israel" },
  { code: "JO", name: "Jordan" },
  { code: "LB", name: "Lebanon" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "KW", name: "Kuwait" },
  { code: "QA", name: "Qatar" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "YE", name: "Yemen" },
  { code: "IQ", name: "Iraq" },
  { code: "IR", name: "Iran" },
  { code: "AF", name: "Afghanistan" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TM", name: "Turkmenistan" },
  { code: "MN", name: "Mongolia" },
  { code: "BT", name: "Bhutan" },
  { code: "MV", name: "Maldives" },
]

// YouTube URL validation
export function isValidYoutubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  return youtubeRegex.test(url)
}

// YouTube video ID extraction
export function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

// Additional utility functions that might be useful
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + "..."
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, "")

  // Format as +91 XXXXX XXXXX for Indian numbers
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }

  // Return as-is if not a standard format
  return phone
}

export function generateRandomColor(): string {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function timeAgo(date: string | Date): string {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
  return `${Math.floor(diffInSeconds / 31536000)} years ago`
}
