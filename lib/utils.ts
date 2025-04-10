import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUserId() {
  return "USER" + Math.random().toString(36).substring(2, 10).toUpperCase()
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatTime(time: string) {
  return time
}

export function getBatchTimeString(batchNumber: string) {
  const batchTimes: Record<string, string> = {
    "1": "5:30 to 6:30",
    "2": "6:40 to 7:40",
    "3": "7:50 to 8:50",
    "4": "5:30 to 6:30",
    "5": "6:40 to 7:40",
    "6": "7:50 to 8:50",
  }

  return batchTimes[batchNumber] || ""
}

export function getBatchLabel(batchNumber: string) {
  const batchLabels: Record<string, string> = {
    "1": "Morning Batch 1 (5:30 to 6:30)",
    "2": "Morning Batch 2 (6:40 to 7:40)",
    "3": "Morning Batch 3 (7:50 to 8:50)",
    "4": "Evening Batch 4 (5:30 to 6:30)",
    "5": "Evening Batch 5 (6:40 to 7:40)",
    "6": "Evening Batch 6 (7:50 to 8:50)",
  }

  return batchLabels[batchNumber] || ""
}

export function getYoutubeEmbedUrl(youtubeLink: string) {
  // Extract video ID from various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = youtubeLink.match(regExp)

  if (match && match[2].length === 11) {
    // Return basic embed URL with minimal parameters
    return `https://www.youtube.com/embed/${match[2]}`
  }

  // If we can't extract the ID, return the original link
  return youtubeLink
}

export function isValidYoutubeUrl(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  return regExp.test(url)
}
