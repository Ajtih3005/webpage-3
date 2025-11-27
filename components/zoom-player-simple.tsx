"use client"

import { useEffect, useState } from "react"

interface ZoomPlayerSimpleProps {
  meetingNumber: string
  passcode: string
  userName?: string
}

export default function ZoomPlayerSimple({ meetingNumber, passcode, userName = "Student" }: ZoomPlayerSimpleProps) {
  const [iframeUrl, setIframeUrl] = useState<string>("")

  useEffect(() => {
    // Clean the meeting number
    const cleanMeetingNumber = meetingNumber.replace(/[\s-]/g, "")

    // Build the Zoom web client URL
    const zoomUrl = `https://zoom.us/wc/${cleanMeetingNumber}/join?prefer=1&un=${encodeURIComponent(userName)}&pwd=${encodeURIComponent(passcode)}`

    console.log("[v0] Zoom iframe URL:", zoomUrl)
    setIframeUrl(zoomUrl)
  }, [meetingNumber, passcode, userName])

  return (
    <div className="relative w-full h-full min-h-[600px] bg-black rounded-lg overflow-hidden">
      {iframeUrl ? (
        <iframe
          src={iframeUrl}
          className="w-full h-full"
          allow="camera; microphone; fullscreen; speaker; display-capture"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-white">Loading Zoom meeting...</div>
      )}
    </div>
  )
}
