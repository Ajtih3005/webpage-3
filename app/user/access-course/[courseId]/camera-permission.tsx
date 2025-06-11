"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Camera } from "lucide-react"

export default function CameraPermission() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let mounted = true

    async function setupCamera() {
      try {
        setIsLoading(true)
        setErrorMessage(null)

        console.log("Requesting camera permission...")
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.muted = true // Start muted to allow autoplay

          // Log video element properties
          console.log("Video element:", {
            width: videoRef.current.width,
            height: videoRef.current.height,
            videoWidth: videoRef.current.videoWidth,
            videoHeight: videoRef.current.videoHeight,
            readyState: videoRef.current.readyState,
            paused: videoRef.current.paused,
            muted: videoRef.current.muted,
          })

          // Force play the video
          try {
            const playPromise = videoRef.current.play()
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log("Video playing successfully")
                  setHasPermission(true)
                })
                .catch((err) => {
                  console.error("Error playing video:", err)
                  setErrorMessage(`Play error: ${err.message}`)
                })
                .finally(() => {
                  setIsLoading(false)
                })
            }
          } catch (playError) {
            console.error("Exception during play():", playError)
            setErrorMessage(`Play exception: ${playError}`)
            setIsLoading(false)
          }
        } else {
          console.error("Video element not found")
          setErrorMessage("Video element not found")
          setIsLoading(false)
        }
      } catch (err: any) {
        if (!mounted) return

        console.error("Camera permission error:", err)
        setHasPermission(false)
        setErrorMessage(`Camera error: ${err.message || "Unknown error"}`)
        setIsLoading(false)
      }
    }

    setupCamera()

    return () => {
      mounted = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const toggleMute = () => {
    if (!streamRef.current || !videoRef.current) return

    const audioTracks = streamRef.current.getAudioTracks()
    if (audioTracks.length > 0) {
      const newMuteState = !isMuted
      audioTracks.forEach((track) => {
        track.enabled = !newMuteState
      })
      videoRef.current.muted = newMuteState
      setIsMuted(newMuteState)
    }
  }

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Camera Preview</h2>

      <div className="relative w-full max-w-md aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        )}

        {errorMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 p-4">
            <div className="text-red-600 text-center">
              <p className="font-semibold">Error:</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          autoPlay
          style={{ display: hasPermission ? "block" : "none" }}
        />
      </div>

      <div className="flex space-x-4 mb-4">
        <Button onClick={toggleMute} variant="outline" disabled={!hasPermission} className="flex items-center">
          {isMuted ? (
            <>
              <MicOff className="w-4 h-4 mr-2" />
              Unmute
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Mute
            </>
          )}
        </Button>
      </div>

      {!hasPermission && !isLoading && (
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <Camera className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
          <p className="font-medium">Camera access is required</p>
          <p className="text-sm text-gray-600 mt-1">Please allow camera access in your browser settings to continue.</p>
          <Button className="mt-3" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      )}

      {hasPermission && (
        <div className="text-sm text-gray-600 text-center">
          <p>Camera is active. You can now join the session.</p>
          <p className="mt-1">Click the unmute button above if you want to enable audio.</p>
        </div>
      )}
    </div>
  )
}
