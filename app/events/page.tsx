"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  IndianRupee,
  TicketIcon,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import Script from "next/script"

interface Event {
  id: string
  event_name: string
  event_date: string
  event_time: string
  venue: string
  description: string
  ticket_price: number
  total_seats: number
  available_seats: number
  image_url: string | null
}

interface BookingFormData {
  name: string
  email: string
  phone: string
  passkey: string
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [step, setStep] = useState<"form" | "verify" | "payment" | "success">("form")
  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    email: "",
    phone: "",
    passkey: "",
  })
  const [userExists, setUserExists] = useState(false)
  const [existingUser, setExistingUser] = useState<any>(null)
  const [processing, setProcessing] = useState(false)
  const [bookingResult, setBookingResult] = useState<any>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/tickets/events")
      const data = await res.json()
      if (data.success) {
        setEvents(data.events)
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkPhoneNumber = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      alert("Please enter a valid phone number")
      return
    }

    setProcessing(true)
    try {
      const res = await fetch("/api/tickets/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone }),
      })
      const data = await res.json()

      if (data.success) {
        if (data.exists) {
          // User exists - use their data, no passkey needed
          setUserExists(true)
          setExistingUser(data.user)
          setFormData({
            ...formData,
            name: data.user.name,
            email: data.user.email,
          })
          // Skip to booking directly
          await createBooking(data.user.id)
        } else {
          // New user - need to set passkey
          setUserExists(false)
          setStep("verify")
        }
      }
    } catch (error) {
      console.error("Failed to check phone:", error)
      alert("Failed to verify phone number")
    } finally {
      setProcessing(false)
    }
  }

  const createBooking = async (userId?: string) => {
    if (!selectedEvent) return

    // Validate form
    if (!formData.name || !formData.email || !formData.phone) {
      alert("Please fill all required fields")
      return
    }

    // If new user, require passkey
    if (!userExists && !userId && formData.passkey.length !== 4) {
      alert("Please enter a 4-digit passkey")
      return
    }

    setProcessing(true)
    try {
      const res = await fetch("/api/tickets/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: selectedEvent.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          passkey: userExists ? null : formData.passkey,
          user_id: userId || existingUser?.id || null,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        alert(data.error || "Failed to create booking")
        return
      }

      if (data.requiresPayment) {
        // Initiate Razorpay payment
        initiatePayment(data.booking, data.order, data.event)
      } else {
        // Free ticket - show success
        setBookingResult(data.booking)
        setStep("success")
      }
    } catch (error) {
      console.error("Failed to create booking:", error)
      alert("Failed to create booking")
    } finally {
      setProcessing(false)
    }
  }

  const initiatePayment = (booking: any, order: any, event: any) => {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: "INR",
      name: "Joyful Yog",
      description: `Ticket for ${event.event_name}`,
      order_id: order.id,
      handler: async (response: any) => {
        // Verify payment
        setProcessing(true)
        try {
          const verifyRes = await fetch("/api/tickets/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: booking.id,
            }),
          })

          const verifyData = await verifyRes.json()

          if (verifyData.success) {
            setBookingResult(verifyData.booking)
            setStep("success")
          } else {
            alert("Payment verification failed")
          }
        } catch (error) {
          console.error("Payment verification error:", error)
          alert("Payment verification failed")
        } finally {
          setProcessing(false)
        }
      },
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone,
      },
      theme: {
        color: "#059669",
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const openBookingDialog = (event: Event) => {
    setSelectedEvent(event)
    setShowBookingDialog(true)
    setStep("form")
    setFormData({ name: "", email: "", phone: "", passkey: "" })
    setUserExists(false)
    setExistingUser(null)
    setBookingResult(null)
  }

  const closeDialog = () => {
    setShowBookingDialog(false)
    setSelectedEvent(null)
    setStep("form")
    setFormData({ name: "", email: "", phone: "", passkey: "" })
    setUserExists(false)
    setExistingUser(null)
    setBookingResult(null)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const h = parseInt(hours)
    const ampm = h >= 12 ? "PM" : "AM"
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-purple-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-purple-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-playfair text-xl font-semibold text-emerald-800">
                Joyful Yog
              </span>
            </Link>
            <Link href="/my-ticket">
              <Button variant="outline" size="sm">
                <TicketIcon className="w-4 h-4 mr-2" />
                My Tickets
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="py-12 text-center">
          <h1 className="font-playfair text-3xl sm:text-4xl font-bold text-emerald-800 mb-4">
            Upcoming Events
          </h1>
          <p className="font-lora text-gray-600 max-w-2xl mx-auto px-4">
            Join our special yoga workshops, retreats, and community gatherings
          </p>
        </section>

        {/* Events Grid */}
        <section className="pb-16 px-4">
          <div className="container mx-auto max-w-6xl">
            {events.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No Upcoming Events
                  </h3>
                  <p className="text-gray-500">
                    Check back soon for new events and workshops
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Card
                    key={event.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="h-40 bg-gradient-to-br from-emerald-400 to-purple-500 flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-white/80" />
                    </div>
                    <CardHeader>
                      <CardTitle className="font-playfair text-xl">
                        {event.event_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.event_date).toLocaleDateString("en-IN", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {formatTime(event.event_time)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {event.venue}
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <IndianRupee className="w-4 h-4" />
                            {event.ticket_price || "Free"}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <Users className="w-4 h-4" />
                            {event.available_seats} left
                          </span>
                        </div>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      <Button
                        onClick={() => openBookingDialog(event)}
                        disabled={event.available_seats <= 0}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 mt-2"
                      >
                        {event.available_seats <= 0 ? "Sold Out" : "Book Now"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Booking Dialog */}
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-playfair">
                {step === "success"
                  ? "Booking Confirmed!"
                  : `Book: ${selectedEvent?.event_name}`}
              </DialogTitle>
            </DialogHeader>

            {step === "form" && (
              <div className="space-y-4">
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="10-digit phone number"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If registered, we will use your account details
                  </p>
                </div>
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="your@email.com"
                  />
                </div>
                <Button
                  onClick={checkPhoneNumber}
                  disabled={processing || !formData.phone || !formData.name || !formData.email}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            )}

            {step === "verify" && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                  <p className="font-medium text-yellow-800">New User</p>
                  <p className="text-yellow-700">
                    Create a 4-digit passkey to access your tickets later
                  </p>
                </div>
                <div>
                  <Label>Create 4-digit Passkey *</Label>
                  <Input
                    type="password"
                    value={formData.passkey}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        passkey: e.target.value.replace(/\D/g, "").slice(0, 4),
                      })
                    }
                    placeholder="4-digit passkey"
                    maxLength={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Remember this passkey to view your tickets
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("form")} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={() => createBooking()}
                    disabled={processing || formData.passkey.length !== 4}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay ${selectedEvent?.ticket_price ? `₹${selectedEvent.ticket_price}` : "& Confirm"}`
                    )}
                  </Button>
                </div>
              </div>
            )}

            {step === "success" && bookingResult && (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
                <div>
                  <h3 className="font-semibold text-lg">Thank You!</h3>
                  <p className="text-gray-600">Your booking has been confirmed</p>
                </div>
                <Card className="text-left">
                  <CardContent className="p-4 space-y-2">
                    <p>
                      <strong>Event:</strong>{" "}
                      {bookingResult.event_tickets?.event_name || selectedEvent?.event_name}
                    </p>
                    <p>
                      <strong>Name:</strong> {bookingResult.booking_name}
                    </p>
                    <p>
                      <strong>QR Code:</strong>{" "}
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {bookingResult.qr_code_data}
                      </code>
                    </p>
                  </CardContent>
                </Card>
                <div className="flex gap-2">
                  <Link href="/my-ticket" className="flex-1">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      View My Tickets
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={closeDialog} className="flex-1 bg-transparent">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
