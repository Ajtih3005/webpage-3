"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"

interface ZoomPlayerSimpleProps {
  meetingNumber: string
  passcode: string
  joinUrl?: string
  userName?: string
  courseId?: string // Added courseId to redirect back to course page
}

export default function ZoomPlayerSimple({
  meetingNumber,
  passcode,
  joinUrl,
  userName,
  courseId,
}: ZoomPlayerSimpleProps) {
  const [iframeUrl, setIframeUrl] = useState<string>("")
  const [meetingEnded, setMeetingEnded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (joinUrl) {
      const urlWithName = userName ? `${joinUrl}&uname=${encodeURIComponent(userName)}` : joinUrl
      setIframeUrl(urlWithName)
    } else {
      const cleanMeetingNumber = meetingNumber.replace(/[\s-]/g, "")
      const displayName = userName || "User"
      const zoomUrl = `https://zoom.us/wc/join/${cleanMeetingNumber}?pwd=${encodeURIComponent(passcode)}&uname=${encodeURIComponent(displayName)}`
      setIframeUrl(zoomUrl)
    }
  }, [meetingNumber, passcode, joinUrl, userName])

  useEffect(() => {
    const checkIframeNavigation = setInterval(() => {
      try {
        if (iframeRef.current?.contentWindow) {
          const iframeWindow = iframeRef.current.contentWindow
          // Try to access the iframe location - if it's changed to Zoom's domain, meeting ended
          // This will throw CORS error but we can detect the attempt
        }
      } catch (e) {
        // CORS error means iframe navigated to different domain (Zoom redirected)
        // Likely meeting ended
      }
    }, 2000)

    return () => clearInterval(checkIframeNavigation)
  }, [])

  const handleReturnToCourse = () => {
    if (courseId) {
      router.push(`/user/courses/${courseId}`)
    } else {
      router.push("/user/courses")
    }
  }

  useEffect(() => {
    const maxMeetingTime = 3 * 60 * 60 * 1000 // 3 hours
    const timer = setTimeout(() => {
      setMeetingEnded(true)
    }, maxMeetingTime)

    return () => clearTimeout(timer)
  }, [])

  if (meetingEnded) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-semibold text-white">Meeting Session Ended</h2>
          <p className="text-gray-400">Thank you for attending the live session!</p>
          <button
            onClick={handleReturnToCourse}
            className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Return to Course
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-black">
      {iframeUrl ? (
        <>
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className="w-full h-full border-0"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            title="Zoom Meeting"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
          />
          <button
            onClick={handleReturnToCourse}
            className="absolute top-4 right-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium transition-colors shadow-lg z-10"
          >
            Leave Meeting
          </button>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-white">
          <p>Loading Zoom meeting...</p>
        </div>
      )}
    </div>
  )
}
