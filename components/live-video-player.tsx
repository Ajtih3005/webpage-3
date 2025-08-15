"use client"

import { useState, useEffect, useRef } from "react"

interface LiveVideoPlayerProps {
  youtubeUrl: string
  courseTitle: string
  startTime?: number // Start time in seconds for live streaming
  isLive?: boolean
}

export default function LiveVideoPlayer({
  youtubeUrl,
  courseTitle,
  startTime = 0,
  isLive = true,
}: LiveVideoPlayerProps) {
  const [currentTime, setCurrentTime] = useState(startTime)
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Extract YouTube video ID
  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  // Calculate live timestamp (for users joining late)
  const calculateLiveTimestamp = () => {
    if (!isLive) return startTime

    // Get current time and calculate how much time has passed since start
    const now = new Date().getTime()
    const sessionStart = new Date().setHours(0, 0, 0, 0) // Assume session started at midnight for demo
    const elapsedSeconds = Math.floor((now - sessionStart) / 1000)

    return startTime + elapsedSeconds
  }

  // Create YouTube embed URL with live timestamp
  const createEmbedUrl = (videoId: string, timestamp: number) => {
    const baseUrl = `https://www.youtube.com/embed/${videoId}`
    const params = new URLSearchParams({
      start: timestamp.toString(),
      autoplay: "1",
      controls: "0", // Hide controls
      disablekb: "1", // Disable keyboard controls
      fs: "0", // Disable fullscreen
      modestbranding: "1", // Hide YouTube logo
      rel: "0", // Don't show related videos
      showinfo: "0", // Hide video info
      iv_load_policy: "3", // Hide annotations
      playsinline: "1", // Play inline on mobile
      enablejsapi: "0", // Disable JS API to prevent control
      origin: window.location.origin,
    })

    return `${baseUrl}?${params.toString()}`
  }

  useEffect(() => {
    if (isLive) {
      // Update timestamp every minute for live streaming
      const interval = setInterval(() => {
        const newTimestamp = calculateLiveTimestamp()
        setCurrentTime(newTimestamp)

        // Reload iframe with new timestamp for live sync
        if (iframeRef.current) {
          const videoId = getYoutubeVideoId(youtubeUrl)
          if (videoId) {
            iframeRef.current.src = createEmbedUrl(videoId, newTimestamp)
          }
        }
      }, 60000) // Update every minute

      return () => clearInterval(interval)
    }
  }, [youtubeUrl, isLive])

  useEffect(() => {
    // Set initial timestamp when component mounts
    if (isLive) {
      const liveTimestamp = calculateLiveTimestamp()
      setCurrentTime(liveTimestamp)
    }
    setIsLoading(false)
  }, [isLive, startTime])

  const videoId = getYoutubeVideoId(youtubeUrl)

  if (!videoId) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <p className="text-white">Invalid YouTube URL</p>
      </div>
    )
  }

  const embedUrl = createEmbedUrl(videoId, currentTime)

  // Format time for display (handles 10+ hour videos)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="w-full">
      {/* Live indicator and timestamp */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{courseTitle}</h2>
        <div className="flex items-center space-x-4">
          {isLive && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-500 font-semibold">LIVE</span>
            </div>
          )}
          <div className="text-sm text-gray-600">Playing from: {formatTime(currentTime)}</div>
        </div>
      </div>

      {/* Video container with no controls */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-white">Loading video...</div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={courseTitle}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          style={{
            pointerEvents: "none", // Disable all interactions
            userSelect: "none",
          }}
        />

        {/* Overlay to prevent any interaction */}
        <div
          className="absolute inset-0 bg-transparent"
          style={{ pointerEvents: "auto" }}
          onContextMenu={(e) => e.preventDefault()} // Disable right-click
        />
      </div>

      {/* Info panel */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-semibold">Status:</span> {isLive ? "Live Streaming" : "Recorded"}
          </div>
          <div>
            <span className="font-semibold">Current Time:</span> {formatTime(currentTime)}
          </div>
          <div>
            <span className="font-semibold">Duration:</span> Supports 10+ hours
          </div>
        </div>

        {isLive && (
          <div className="mt-2 text-xs text-gray-600">
            * Video automatically syncs every minute. All viewers see the same timestamp regardless of join time.
          </div>
        )}
      </div>
    </div>
  )
}
