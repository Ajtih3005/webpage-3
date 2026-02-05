"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  XCircle,
  AlertCircle,
  QrCode,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
} from "lucide-react"
import { BarcodeDetector } from "barcode-detector"
import AdminLayout from "@/components/admin-layout"

interface BookingResult {
  id: string
  booking_name: string
  booking_email: string
  booking_phone: string
  is_paid: boolean
  is_attended: boolean
  attended_at: string | null
  event_tickets: {
    event_name: string
    event_date: string
    event_time: string
    venue: string
  }
}

export default function QRScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [result, setResult] = useState<{
    success: boolean
    message: string
    booking?: BookingResult
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef(false)
  const detectorRef = useRef<BarcodeDetector | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Get password from localStorage (set by AdminLayout)
  const getPassword = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("adminPassword") || ""
    }
    return ""
  }

  // Initialize barcode detector once
  useEffect(() => {
    // Use the polyfill - it works on all browsers
    detectorRef.current = new BarcodeDetector({ formats: ["qr_code"] })
    console.log("[v0] BarcodeDetector initialized using polyfill")
    
    return () => {
      detectorRef.current = null
    }
  }, [])

  const stopScanner = useCallback(() => {
    console.log("[v0] Stopping scanner")
    scanningRef.current = false
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setScanning(false)
  }, [])

  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !scanningRef.current || !detectorRef.current) {
      console.log("[v0] Scanner refs not ready:", {
        video: !!videoRef.current,
        canvas: !!canvasRef.current,
        scanning: scanningRef.current,
        detector: !!detectorRef.current
      })
      return
    }

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      // Video not ready yet, try again
      console.log("[v0] Video not ready, retrying...", {
        hasCtx: !!ctx,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      })
      if (scanningRef.current) {
        animationFrameRef.current = requestAnimationFrame(scanQRCode)
      }
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Use the polyfill detector
    detectorRef.current
      .detect(canvas)
      .then((barcodes: { rawValue: string }[]) => {
        if (barcodes.length > 0) {
          console.log("[v0] QR Code detected:", barcodes[0].rawValue)
          const qrData = barcodes[0].rawValue
          verifyQRCode(qrData)
          stopScanner()
          return
        }
        // Continue scanning if still active
        if (scanningRef.current) {
          animationFrameRef.current = requestAnimationFrame(scanQRCode)
        }
      })
      .catch((error: Error) => {
        console.log("[v0] Scan error:", error)
        // Continue scanning on error if still active
        if (scanningRef.current) {
          animationFrameRef.current = requestAnimationFrame(scanQRCode)
        }
      })
  }, [stopScanner])

  const startScanner = async () => {
    console.log("[v0] Starting scanner...")
    
    if (!detectorRef.current) {
      // Re-initialize detector if needed
      detectorRef.current = new BarcodeDetector({ formats: ["qr_code"] })
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      })
      console.log("[v0] Camera stream obtained")
      streamRef.current = stream
      
      if (videoRef.current) {
        const video = videoRef.current
        
        // Set scanning state immediately so UI updates
        setScanning(true)
        scanningRef.current = true
        
        // Set up the video element
        video.srcObject = stream
        
        // Function to start scanning once video is ready
        const startScanningLoop = () => {
          console.log("[v0] Video dimensions:", video.videoWidth, "x", video.videoHeight)
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            console.log("[v0] Starting QR scan loop")
            scanQRCode()
          } else {
            // Video not ready yet, wait and retry
            console.log("[v0] Video not ready, waiting...")
            setTimeout(startScanningLoop, 200)
          }
        }
        
        // Try to play the video
        try {
          await video.play()
          console.log("[v0] Video play() succeeded")
          // Give it a moment to render frames
          setTimeout(startScanningLoop, 500)
        } catch (playError) {
          console.error("[v0] Video play error:", playError)
          // Still try to start scanning - autoPlay might work
          setTimeout(startScanningLoop, 500)
        }
      }
    } catch (error) {
      console.error("[v0] Camera access denied:", error)
      alert("Please allow camera access to scan QR codes")
    }
  }

  const verifyQRCode = async (qrData: string) => {
    const password = getPassword()
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/tickets/verify-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ qr_code_data: qrData }),
      })

      const data = await res.json()

      if (data.success) {
        setResult({
          success: true,
          message: "Check-in successful!",
          booking: data.booking,
        })
      } else {
        setResult({
          success: false,
          message: data.error || "Verification failed",
          booking: data.booking,
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to verify QR code",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualVerify = () => {
    if (manualCode.trim()) {
      verifyQRCode(manualCode.trim())
    }
  }

  // Auto-start scanner on mount and cleanup on unmount
  useEffect(() => {
    // Auto-start the scanner when page loads
    const timer = setTimeout(() => {
      startScanner()
    }, 500)
    
    return () => {
      clearTimeout(timer)
      stopScanner()
    }
  }, [])

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">QR Scanner</h1>
          <Link href="/admin/tickets">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tickets
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            {!scanning ? (
              <div className="text-center space-y-4">
                <QrCode className="w-16 h-16 mx-auto text-emerald-600 animate-pulse" />
                <p className="text-gray-600">Opening scanner...</p>
                <Button onClick={startScanner} className="bg-emerald-600 hover:bg-emerald-700">
                  <Camera className="w-4 h-4 mr-2" />
                  Open Scanner
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-square max-w-sm mx-auto bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  <div className="absolute inset-0 border-4 border-emerald-500 rounded-lg pointer-events-none">
                    <div className="absolute inset-[20%] border-2 border-white/50 rounded" />
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <Button
                  onClick={stopScanner}
                  variant="destructive"
                  className="w-full"
                >
                  Stop Scanner
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Manual Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>QR Code Data</Label>
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter QR code data (e.g., TKT-abc12345-xyz)"
                onKeyDown={(e) => e.key === "Enter" && handleManualVerify()}
              />
            </div>
            <Button
              onClick={handleManualVerify}
              disabled={loading || !manualCode.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? "Verifying..." : "Verify Manually"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card
            className={
              result.success
                ? "border-green-500 bg-green-50"
                : "border-red-500 bg-red-50"
            }
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {result.success ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : result.message === "Already checked in" ? (
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
                <div>
                  <h3
                    className={`font-semibold text-lg ${
                      result.success ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {result.message}
                  </h3>
                </div>
              </div>

              {result.booking && (
                <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{result.booking.booking_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{result.booking.booking_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{result.booking.booking_phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {result.booking.event_tickets?.event_name} -{" "}
                      {new Date(result.booking.event_tickets?.event_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{result.booking.event_tickets?.venue}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {result.booking.is_paid ? (
                      <Badge className="bg-green-100 text-green-800">Paid</Badge>
                    ) : (
                      <Badge variant="destructive">Unpaid</Badge>
                    )}
                    {result.booking.is_attended && (
                      <Badge className="bg-purple-100 text-purple-800">
                        Checked In
                        {result.booking.attended_at &&
                          ` at ${new Date(result.booking.attended_at).toLocaleTimeString()}`}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={() => {
                  setResult(null)
                  setManualCode("")
                }}
                variant="outline"
                className="w-full mt-4"
              >
                Scan Next
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
