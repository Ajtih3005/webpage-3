"use client"

import { useEffect, useState } from "react"

interface ZoomPlayerSimpleProps {
  meetingNumber: string
  passcode: string
  joinUrl?: string
  userName?: string // Added userName prop
}

export default function ZoomPlayerSimple({ meetingNumber, passcode, joinUrl, userName }: ZoomPlayerSimpleProps) {
  const [iframeUrl, setIframeUrl] = useState<string>("")

  useEffect(() => {
    if (joinUrl) {
      console.log("[v0] Using provided Zoom join URL:", joinUrl)
      const urlWithName = userName ? `${joinUrl}&uname=${encodeURIComponent(userName)}` : joinUrl
      setIframeUrl(urlWithName)
    } else {
      // Clean the meeting number (remove spaces and hyphens)
      const cleanMeetingNumber = meetingNumber.replace(/[\s-]/g, "")

      const displayName = userName || "User"
      const zoomUrl = `https://zoom.us/wc/join/${cleanMeetingNumber}?pwd=${encodeURIComponent(passcode)}&uname=${encodeURIComponent(displayName)}`

      console.log("[v0] Generated Zoom iframe URL with username:", zoomUrl)
      setIframeUrl(zoomUrl)
    }
  }, [meetingNumber, passcode, joinUrl, userName])

  return (
    <div className="relative w-full h-full bg-black">
      {iframeUrl ? (
        <iframe
          src={iframeUrl}
          className="w-full h-full border-0"
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          title="Zoom Meeting"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-white">
          <p>Loading Zoom meeting...</p>
        </div>
      )}
    </div>
  )
}
