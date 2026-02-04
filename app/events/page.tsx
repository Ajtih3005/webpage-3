"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import Image from "next/image"
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
  Plus,
  Minus,
  Trash2,
  FileText,
  ShoppingCart,
  Check,
} from "lucide-react"

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

interface Attendee {
  name: string
  email: string
  phone: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showBookingPage, setShowBookingPage] = useState(false)
  
  // Booking state
  const [attendees, setAttendees] = useState<Attendee[]>([{ name: "", email: "", phone: "" }])
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingResult, setBookingResult] = useState<any>(null)
  const [razorpayKey, setRazorpayKey] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
    fetchRazorpayKey()
  }, [])

  const fetchRazorpayKey = async () => {
    try {
      const response = await fetch("/api/razorpay/get-key")
      const data = await response.json()
      if (data.key) {
        setRazorpayKey(data.key)
      }
    } catch (err) {
      console.error("Error fetching Razorpay key:", err)
    }
  }

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

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const h = Number.parseInt(hours)
    const ampm = h >= 12 ? "PM" : "AM"
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const openBookingPage = (event: Event) => {
    setSelectedEvent(event)
    setShowBookingPage(true)
    setAttendees([{ name: "", email: "", phone: "" }])
    setTermsAccepted(false)
    setError(null)
    setBookingSuccess(false)
    setBookingResult(null)
  }

  const closeBookingPage = () => {
    setShowBookingPage(false)
    setSelectedEvent(null)
    setAttendees([{ name: "", email: "", phone: "" }])
    setTermsAccepted(false)
    setError(null)
    setBookingSuccess(false)
  }

  const addAttendee = () => {
    if (selectedEvent && attendees.length < selectedEvent.available_seats) {
      setAttendees([...attendees, { name: "", email: "", phone: "" }])
    }
  }

  const removeAttendee = (index: number) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((_, i) => i !== index))
    }
  }

  const updateAttendee = (index: number, field: keyof Attendee, value: string) => {
    const updated = [...attendees]
    updated[index][field] = value
    setAttendees(updated)
  }

  const getTotalPrice = () => {
    if (!selectedEvent) return 0
    return selectedEvent.ticket_price * attendees.length
  }

  const isFormValid = () => {
    return attendees.every(a => a.name && a.email && a.phone && a.phone.length >= 10)
  }

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleBooking = async () => {
    if (!selectedEvent || !isFormValid() || !termsAccepted) return

    setProcessing(true)
    setError(null)

    try {
      const totalAmount = getTotalPrice()
      
      if (totalAmount > 0) {
        // PAID EVENT - Only create booking after payment is verified
        // Load Razorpay script
        const loaded = await loadRazorpayScript()
        if (!loaded) {
          throw new Error("Failed to load payment gateway")
        }

        if (!razorpayKey) {
          throw new Error("Payment gateway not configured")
        }

        // Create order (no booking created yet)
        const orderRes = await fetch("/api/tickets/create-combined-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: selectedEvent.id,
            event_name: selectedEvent.event_name,
            attendees: attendees,
            amount: totalAmount,
          }),
        })

        const orderData = await orderRes.json()
        if (!orderData.success) {
          throw new Error(orderData.error || "Failed to create payment order")
        }

        // Open Razorpay
        const options = {
          key: razorpayKey,
          amount: orderData.order.amount,
          currency: "INR",
          name: "Sthavishtah Yoga",
          description: `${attendees.length} ticket(s) for ${selectedEvent.event_name}`,
          order_id: orderData.order.id,
          handler: async (response: any) => {
            try {
              // Verify payment AND create bookings
              const verifyRes = await fetch("/api/tickets/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  event_id: selectedEvent.id,
                  attendees: attendees,
                }),
              })

              const verifyData = await verifyRes.json()
              console.log("[v0] Verify payment response:", verifyData)
              if (verifyData.success) {
                setBookingSuccess(true)
                setBookingResult({ bookings: verifyData.bookings, event: selectedEvent })
              } else {
                console.error("[v0] Payment verification failed:", verifyData)
                setError(verifyData.error || "Payment verification failed. Please contact support.")
              }
            } catch (err) {
              console.error("[v0] Payment verification error:", err)
              setError(err instanceof Error ? err.message : "Payment verification failed. Please contact support.")
            }
            setProcessing(false)
          },
          prefill: {
            name: attendees[0].name,
            email: attendees[0].email,
            contact: attendees[0].phone,
          },
          theme: {
            color: "#059669",
          },
          modal: {
            ondismiss: () => {
              setProcessing(false)
            }
          }
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      } else {
        // FREE EVENT - Create bookings directly
        const bookings = []
        for (const attendee of attendees) {
          const res = await fetch("/api/tickets/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ticket_id: selectedEvent.id,
              name: attendee.name,
              email: attendee.email,
              phone: attendee.phone,
            }),
          })
          const data = await res.json()
          if (data.success) {
            bookings.push(data.booking)
          }
        }
        
        if (bookings.length > 0) {
          setBookingSuccess(true)
          setBookingResult({ bookings, event: selectedEvent })
        } else {
          throw new Error("Failed to create bookings")
        }
        setProcessing(false)
      }
    } catch (err) {
      console.error("Booking error:", err)
      setError(err instanceof Error ? err.message : "Failed to process booking")
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-purple-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  // Booking Page View
  if (showBookingPage && selectedEvent) {
    // Success View
    if (bookingSuccess && bookingResult) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-purple-50">
          <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/images/logo.png" alt="Logo" width={40} height={40} className="rounded-full" />
                <span className="font-playfair text-xl font-semibold text-emerald-800">Sthavishtah</span>
              </Link>
            </div>
          </header>

          <div className="container mx-auto py-12 px-4 max-w-2xl">
            <Card className="border-2 border-green-200">
              <CardContent className="pt-8 text-center">
                <CheckCircle2 className="w-20 h-20 mx-auto text-green-500 mb-6" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
                <p className="text-gray-600 mb-6">Your tickets have been booked successfully</p>

                <div className="bg-green-50 rounded-lg p-6 text-left mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">{bookingResult.event.event_name}</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Date:</strong> {formatDate(bookingResult.event.event_date)}</p>
                    <p><strong>Time:</strong> {formatTime(bookingResult.event.event_time)}</p>
                    <p><strong>Venue:</strong> {bookingResult.event.venue}</p>
                    <p><strong>Tickets:</strong> {bookingResult.bookings.length}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    QR codes have been sent to the registered email addresses.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/my-ticket">
                      <Button className="bg-emerald-600 hover:bg-emerald-700">View My Tickets</Button>
                    </Link>
                    <Button variant="outline" onClick={closeBookingPage}>Book Another</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    // Booking Form View
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-purple-50">
        <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/images/logo.png" alt="Logo" width={40} height={40} className="rounded-full" />
              <span className="font-playfair text-xl font-semibold text-emerald-800">Sthavishtah</span>
            </Link>
            <Link href="/my-ticket">
              <Button variant="outline" size="sm">
                <TicketIcon className="w-4 h-4 mr-2" />
                My Tickets
              </Button>
            </Link>
          </div>
        </header>

        <div className="container mx-auto py-8 px-4 max-w-5xl">
          <Button variant="ghost" onClick={closeBookingPage} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Booking</h1>
            <p className="text-gray-600">Review event details and add attendee information</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Side - Event Details */}
            <Card className="border-2 h-fit">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{selectedEvent.event_name}</CardTitle>
                  <ShoppingCart className="h-5 w-5 text-emerald-600" />
                </div>
                <CardDescription>{selectedEvent.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3 py-3 border-b">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold">{formatDate(selectedEvent.event_date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-3 border-b">
                  <Clock className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-semibold">{formatTime(selectedEvent.event_time)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-3 border-b">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm text-gray-500">Venue</p>
                    <p className="font-semibold">{selectedEvent.venue}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-3 border-b">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm text-gray-500">Available Seats</p>
                    <p className="font-semibold">{selectedEvent.available_seats} remaining</p>
                  </div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Price per ticket</span>
                    <span className="text-xl font-bold text-emerald-600">
                      {selectedEvent.ticket_price > 0 ? `₹${selectedEvent.ticket_price}` : "FREE"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-200">
                    <span className="font-semibold text-gray-900">Total ({attendees.length} ticket{attendees.length > 1 ? 's' : ''})</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      {getTotalPrice() > 0 ? `₹${getTotalPrice()}` : "FREE"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Side - Attendee Details */}
            <Card className="border-2">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-xl">Attendee Details</CardTitle>
                <CardDescription>Enter details for each person attending</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Number of Tickets */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Number of Tickets</span>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeAttendee(attendees.length - 1)}
                      disabled={attendees.length <= 1}
                      className="h-8 w-8"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-bold text-lg">{attendees.length}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={addAttendee}
                      disabled={attendees.length >= selectedEvent.available_seats}
                      className="h-8 w-8"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Attendee Forms */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {attendees.map((attendee, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-gray-700">
                          Attendee {index + 1}
                        </span>
                        {attendees.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttendee(index)}
                            className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-3">
                        <div>
                          <Label className="text-xs">Full Name *</Label>
                          <Input
                            value={attendee.name}
                            onChange={(e) => updateAttendee(index, "name", e.target.value)}
                            placeholder="Enter full name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Email *</Label>
                          <Input
                            type="email"
                            value={attendee.email}
                            onChange={(e) => updateAttendee(index, "email", e.target.value)}
                            placeholder="email@example.com"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Phone *</Label>
                          <Input
                            value={attendee.phone}
                            onChange={(e) => updateAttendee(index, "phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                            placeholder="10-digit phone number"
                            maxLength={10}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Terms & Conditions */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Terms & Conditions
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 space-y-1 max-h-32 overflow-y-auto">
                    <p>• Tickets are non-refundable once purchased.</p>
                    <p>• Please arrive 15 minutes before the event starts.</p>
                    <p>• Carry a valid ID for verification at the venue.</p>
                    <p>• QR code will be sent to the registered email.</p>
                  </div>
                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      I agree to the terms and conditions
                    </label>
                  </div>
                </div>

                {/* Payment Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleBooking}
                    disabled={processing || !isFormValid() || !termsAccepted}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : getTotalPrice() > 0 ? (
                      `Pay ₹${getTotalPrice()}`
                    ) : (
                      "Confirm Booking"
                    )}
                  </Button>
                </div>

                <div className="text-center pt-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Secure payment powered by Razorpay</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Events List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="Logo" width={40} height={40} className="rounded-full" />
            <span className="font-playfair text-xl font-semibold text-emerald-800">Sthavishtah</span>
          </Link>
          <Link href="/my-ticket">
            <Button variant="outline" size="sm">
              <TicketIcon className="w-4 h-4 mr-2" />
              My Tickets
            </Button>
          </Link>
        </div>
      </header>

      <section className="py-12 text-center">
        <h1 className="font-playfair text-3xl sm:text-4xl font-bold text-emerald-800 mb-4">
          Upcoming Events
        </h1>
        <p className="font-lora text-gray-600 max-w-2xl mx-auto px-4">
          Join our special yoga workshops, retreats, and community gatherings
        </p>
      </section>

      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {events.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Upcoming Events</h3>
                <p className="text-gray-500">Check back soon for new events and workshops</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-40 bg-gradient-to-br from-emerald-400 to-purple-500 flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-white/80" />
                  </div>
                  <CardHeader>
                    <CardTitle className="font-playfair text-xl">{event.event_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {formatDate(event.event_date)}
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
                      <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                    )}
                    <Button
                      onClick={() => openBookingPage(event)}
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
    </div>
  )
}
