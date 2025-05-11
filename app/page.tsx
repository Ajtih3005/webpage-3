"use client"

import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Calendar,
  Utensils,
  Dumbbell,
  Brain,
  Users,
  Instagram,
  ArrowRight,
  Leaf,
  Sun,
  Moon,
  Menu,
  X,
  ChevronRight,
  Heart,
  Wind,
  Sparkles,
} from "lucide-react"
import { useState, useEffect } from "react"
import ReviewCarousel from "@/components/review-carousel"

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Add scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with responsive menu */}
      <header
        className={`w-full py-3 px-4 sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-white/90 border-b border-green-100"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative h-10 w-10 mr-2 sm:h-12 sm:w-12 sm:mr-3 overflow-hidden rounded-full border-2 border-green-100 shadow-sm">
              <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" priority />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-800 to-green-600">
                STHAVISHTAH
              </span>
              <span className="text-xs tracking-widest text-green-700/70 hidden sm:block">YOGA AND WELLNESS</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-3">
            <Link
              href="/user/login"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white hover:bg-green-50 text-green-700 border border-green-200 h-9 px-4 py-2 font-medium transition-all duration-300 hover:shadow-sm"
            >
              Login
            </Link>
            <Link
              href="/updates"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white hover:bg-green-50 text-green-700 border border-green-200 h-9 px-4 py-2 font-medium transition-all duration-300 hover:shadow-sm"
            >
              Updates
            </Link>
            <Link
              href="/user/register"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 forest-button"
            >
              Register
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="text-green-800 hover:bg-green-50"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg z-50 border-b border-green-100 animate-in slide-in-from-top-5 duration-300">
            <div className="flex flex-col p-4 space-y-3">
              <Link
                href="/user/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-start w-full px-4 py-3 text-green-700 hover:bg-green-50 hover:text-green-800 rounded-md transition-colors"
              >
                Login
              </Link>
              <Link
                href="/updates"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-start w-full px-4 py-3 text-green-700 hover:bg-green-50 hover:text-green-800 rounded-md transition-colors"
              >
                Updates
              </Link>
              <Link
                href="/user/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-full px-4 py-3 forest-button rounded-md"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section with Enhanced Forest Meditation Background */}
      <section className="relative flex items-center justify-center py-20 md:py-28 lg:py-36 overflow-hidden min-h-[80vh]">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/serene-forest-meditation.jpg"
            alt="Serene Forest Meditation Space"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/70 to-green-800/60 backdrop-blur-[2px]"></div>
        </div>

        {/* Enhanced Decorative Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzR2LTRoLTJ2NGgtNHYyaDR2NHgydi00aDR2LTJoLTR6bTAtMzBWMGgtMnY0aC00djJoNHY0aDJWNmg0VjRoLTR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0ySDZ6TTYgNFYwSDR2NEgwdjJoNHY0aDJWNmg0VjRINnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20 -z-10"></div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/20 animate-float"
              style={{
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 10 + 10}s`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 text-center relative z-10 flex flex-col items-center justify-center">
          <div className="flex justify-center mb-8 md:mb-10">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full p-2 shadow-xl gentle-sway bg-white/10 backdrop-blur-md border border-white/20">
              <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" priority />
            </div>
          </div>

          <div className="staggered-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-8 text-white drop-shadow-md">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-green-100">
                STHAVISHTAH
              </span>
              <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-green-100">
                YOGA AND WELLNESS
              </span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl mb-5 md:mb-7 max-w-3xl mx-auto text-white/90 font-light">
              Find your inner peace through mindful practice
            </p>

            <p className="text-base md:text-lg mb-10 md:mb-12 max-w-2xl mx-auto text-white/80">
              Join our serene community and embark on a journey of self-discovery and natural wellness.
            </p>
          </div>

          {/* Repositioned Explore indicator to bottom right corner */}
          <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full animate-pulse hover:bg-white/20 transition-colors cursor-pointer">
            <span className="text-white/80 text-sm">Explore</span>
            <ChevronRight className="h-5 w-5 text-white/80 transform rotate-90" />
          </div>

          <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white/10 to-transparent"></div>
        </div>
      </section>

      {/* Buttons Section - Enhanced with better spacing and animations */}
      <section className="py-10 bg-gradient-to-r from-green-100 to-green-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-5">
            <Link
              href="/user/register"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-12 px-8 bg-green-600 text-white hover:bg-green-700 font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px] w-full sm:w-auto group"
            >
              <span>Join Our Journey</span>
              <Leaf className="ml-2 h-4 w-4 group-hover:animate-bounce" />
            </Link>
            <Link
              href="/user/login"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-12 px-8 bg-white text-green-700 border border-green-200 hover:bg-green-50 transition-all w-full sm:w-auto hover:shadow-md"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Tagline Section - Enhanced with subtle animations */}
      <section className="py-10 md:py-14 bg-gradient-to-r from-green-50 to-green-100/50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 -z-10">
          <Image
            src="/images/forest-pattern-bg.jpg"
            alt="Forest Pattern Background"
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-800 to-green-600 animate-pulse">
            BREATHE, BALANCE, BECOME
          </h2>
          <div className="flex items-center justify-center">
            <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-green-300"></div>
            <p className="text-base sm:text-lg md:text-xl text-green-700 font-semibold px-3 sm:px-5">
              Sessions starting from May 12, 2025
            </p>
            <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-green-300 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Batch Schedule Section - Enhanced with better cards and animations */}
      <section className="py-14 md:py-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-200 via-green-300 to-green-200"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-30 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-100 rounded-full translate-y-1/2 -translate-x-1/2 opacity-30 blur-3xl"></div>

        {/* Floating leaves decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-green-500/20 animate-float-slow"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 15 + 15}s`,
                animationDelay: `${Math.random() * 5}s`,
                transform: `rotate(${Math.random() * 360}deg) scale(${Math.random() * 0.5 + 0.5})`,
              }}
            >
              <Leaf className="h-12 w-12 md:h-16 md:w-16" />
            </div>
          ))}
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-10 md:mb-14">
            <span className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-4">
              Our Schedule
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4 text-green-800">Flexible Batches</h2>
            <p className="text-center text-gray-600 max-w-2xl mx-auto">
              Choose from our flexible schedule designed to harmonize with your natural rhythms.
            </p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {/* Morning Batches */}
            <Card className="nature-card overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500 group-hover:h-3"></div>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-5">
                  <div className="p-3 rounded-full bg-yellow-100 mr-3 group-hover:bg-yellow-200 transition-colors">
                    <Sun className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-500" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-center text-green-700 transition-colors">
                    Morning Batch
                  </h3>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <BatchTime number="1" time="5:30 - 6:30" isNew={true} />
                  <BatchTime number="2" time="6:40 - 7:40" />
                  <BatchTime number="3" time="7:50 - 8:50" />
                </div>
              </CardContent>
            </Card>

            {/* Evening Batches */}
            <Card className="nature-card overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-500 group-hover:h-3"></div>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-5">
                  <div className="p-3 rounded-full bg-indigo-100 mr-3 group-hover:bg-indigo-200 transition-colors">
                    <Moon className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-500" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-center text-green-700 transition-colors">
                    Evening Batch
                  </h3>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <BatchTime number="4" time="5:30 - 6:30" />
                  <BatchTime number="5" time="6:40 - 7:40" isNew={true} />
                  <BatchTime number="6" time="7:50 - 8:50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Offerings Section with Riverside Yoga Background - Enhanced with better cards */}
      <section className="py-14 md:py-20 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/riverside-yoga.jpg"
            alt="Peaceful Riverside Yoga"
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 to-white/85 backdrop-blur-[1px]"></div>
        </div>

        {/* Light Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwNDdBMzgiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50 -z-10"></div>

        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-green-200 to-transparent"></div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <div className="inline-block bg-white/80 backdrop-blur-sm py-6 px-8 rounded-xl shadow-sm">
              <span className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-4">
                Our Services
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4 text-green-800">Our Offerings</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Holistic wellness practices inspired by nature's wisdom.
              </p>
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 staggered-fade-in">
              <OfferingCard
                icon={<Users className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />}
                title="Yoga for Health & Flexibility"
                description="Gentle practices to improve mobility, reduce stress, and enhance your connection with nature and self."
              />
              <OfferingCard
                icon={<Dumbbell className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />}
                title="Light Muscle Training"
                description="Strengthen your body with movements inspired by natural forms and patterns."
              />
              <OfferingCard
                icon={<Utensils className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />}
                title="Natural Diet Plans"
                description="Nourish your body with seasonal, wholesome nutrition plans that support your wellbeing and the environment."
              />
              <OfferingCard
                icon={<Brain className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />}
                title="Mental Wellness Sessions"
                description="Forest-inspired meditation and mindfulness practices to cultivate inner peace and clarity."
              />
              <OfferingCard
                icon={<Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />}
                title="Flexible Batches"
                description="Join any of our six daily sessions that align with your natural rhythm. Connect with our community for support and guidance."
              />
              <OfferingCard
                icon={<CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />}
                title="Orientation Sessions"
                description="Begin your journey with guidance that honors your unique path and connects you to our peaceful community."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Enhanced with better styling */}
      <section className="py-14 md:py-20 bg-gradient-to-r from-green-50 to-green-100/50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 -z-10">
          <Image
            src="/images/forest-pattern-bg.jpg"
            alt="Forest Pattern Background"
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-green-200 to-transparent"></div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-green-200 to-transparent"></div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-4">
              Testimonials
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4 text-green-800">What Our Students Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover how our practices have transformed the lives of our community members.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <ReviewCarousel />
          </div>
        </div>
      </section>

      {/* Promotion Section with Forest Background Image - Enhanced with better visuals */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/forest-yoga-bg.jpg"
            alt="Forest Yoga Background"
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 to-green-800/80"></div>
        </div>

        {/* Decorative Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvc3ZnPg==')] -z-10"></div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/20 animate-float"
              style={{
                width: `${Math.random() * 8 + 3}px`,
                height: `${Math.random() * 8 + 3}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 10 + 10}s`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 text-center">
          <div className="inline-block mb-6 md:mb-8 px-5 py-2 sm:px-6 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full text-white font-medium">
            <Sparkles className="inline-block h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-pulse" />
            Limited Time Offer
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 md:mb-7 text-white drop-shadow-lg">
            JOIN NOW FOR FREE SESSIONS FOR 1 MONTH
          </h2>

          <p className="text-xl md:text-2xl mb-8 md:mb-10 text-white/90 drop-shadow-lg max-w-2xl mx-auto">
            Sessions starting from May 18, 2025.
          </p>

          <div className="flex justify-center mb-8 md:mb-10">
            <div className="bg-white/90 backdrop-blur-sm p-5 sm:p-6 rounded-xl shadow-2xl flex flex-col items-center transform transition-transform hover:scale-105 duration-300">
              <div className="text-green-800 font-bold mb-3 sm:mb-4 text-center text-sm sm:text-base">
                SCAN FOR WHATSAPP CHANNEL
              </div>
              <div className="h-36 w-36 sm:h-48 sm:w-48 relative rounded-lg overflow-hidden shadow-inner">
                <Image src="/images/whatsapp-qr.png" alt="WhatsApp Channel QR Code" fill className="object-contain" />
              </div>
            </div>
          </div>

          <p className="text-base md:text-lg text-white/90 mb-6 md:mb-8">
            Quiet your mind, strengthen your body, awaken your spirit. Start your yoga journey today!
          </p>
        </div>
      </section>

      {/* Features Grid - Enhanced with better cards */}
      <section className="py-14 md:py-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-green-200 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-50 rounded-full opacity-70"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-50 rounded-full opacity-70"></div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-4">
              Our Approach
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4 text-green-800">PHYSICAL AND MENTAL WELLNESS</h2>
            <p className="text-center text-gray-600 mb-8 md:mb-12 max-w-2xl mx-auto">
              Our holistic approach nurtures both body and mind in harmony with nature.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            <WellnessCard
              icon={<Utensils className="h-8 w-8 text-green-600" />}
              title="NATURAL NUTRITION"
              content="Our mindful eating plans are designed to nourish your body with seasonal, whole foods. We focus on sustainable nutrition that supports your yoga practice, enhances your energy levels, and promotes overall wellbeing."
            />
            <WellnessCard
              icon={<Wind className="h-8 w-8 text-green-600" />}
              title="MINDFUL MOVEMENT"
              content="Our approach to physical wellness combines gentle yoga poses, mindful breathing, and natural movement patterns. We help you develop strength, flexibility, and balance in a way that honors your body's wisdom."
            />
            <WellnessCard
              icon={<Heart className="h-8 w-8 text-green-600" />}
              title="FOREST MEDITATION"
              content="Our meditation practices draw inspiration from the tranquility of forests. Learn techniques to quiet the mind, cultivate presence, and develop a deeper connection with yourself and the natural world around you."
            />
          </div>
        </div>
      </section>

      {/* Footer - Enhanced with better styling */}
      <footer className="bg-gradient-to-br from-green-900 to-green-800 text-white py-14 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaHQtNHptMC0zMFYwaC0ydjRoLTR2MmgtNHY0aDJWNmg0VjRoLTR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0ySDZ6TTYgNFYwSDR2NEgwdjJoNHY0aDJWNmg0VjRINnoiLz48L2c+PC9nPjwvc3ZnPg==')] -z-10"></div>

        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            <div>
              <div className="flex items-center mb-5 md:mb-6">
                <div className="relative h-10 w-10 sm:h-12 sm:w-12 mr-3 sm:mr-4 rounded-full overflow-hidden border border-white/20">
                  <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-green-200">
                  STHAVISHTAH YOGA
                </h3>
              </div>
              <p className="mb-4 text-gray-300 text-sm sm:text-base">
                Nurturing mind, body, and spirit through authentic yoga practices and natural wellness approaches.
              </p>
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} STHAVISHTAH YOGA. All rights reserved.
              </p>
            </div>

            <div className="mt-4 sm:mt-0">
              <h3 className="text-lg sm:text-xl font-bold mb-5 md:mb-6 relative inline-block">
                Contact Us
                <span className="absolute -bottom-2 left-0 w-12 h-1 bg-green-400 rounded-full"></span>
              </h3>
              <p className="mb-4 md:mb-5 text-gray-300 text-sm sm:text-base">Email: sthavishtah2024@gmail.com</p>
              <div className="flex items-center mb-4 md:mb-5 text-gray-300 hover:text-white transition-colors">
                <Instagram className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                <span className="text-sm sm:text-base">@sthavishtah</span>
              </div>
              <p className="text-gray-300 text-sm sm:text-base">Address: Bengaluru, India</p>
            </div>

            <div className="mt-4 md:mt-0">
              <h3 className="text-lg sm:text-xl font-bold mb-5 md:mb-6 relative inline-block">
                Quick Links
                <span className="absolute -bottom-2 left-0 w-12 h-1 bg-green-400 rounded-full"></span>
              </h3>
              <ul className="space-y-3 sm:space-y-4">
                <li>
                  <Link
                    href="/user/login"
                    className="text-gray-300 hover:text-white transition-colors flex items-center text-sm sm:text-base group"
                  >
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:translate-x-1 transition-transform" />
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/user/register"
                    className="text-gray-300 hover:text-white transition-colors flex items-center text-sm sm:text-base group"
                  >
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:translate-x-1 transition-transform" />
                    Register
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/login"
                    className="text-gray-300 hover:text-white transition-colors flex items-center text-sm sm:text-base group"
                  >
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:translate-x-1 transition-transform" />
                    Admin
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function BatchTime({ number, time, isNew = false }: { number: string; time: string; isNew?: boolean }) {
  return (
    <div className="flex items-center p-3 sm:p-4 border rounded-lg bg-green-50/50 hover:bg-green-50 transition-colors shadow-sm group">
      <Badge
        variant="outline"
        className="mr-3 sm:mr-4 px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-bold forest-badge group-hover:bg-green-100/50 transition-colors"
      >
        BATCH {number}
      </Badge>
      <span className="font-medium text-green-800 text-sm sm:text-base">{time}</span>
      {isNew && (
        <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full animate-pulse">New</span>
      )}
    </div>
  )
}

function OfferingCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="nature-card h-full bg-white/90 backdrop-blur-sm group overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-green-400 to-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-green-50 rounded-full group-hover:bg-green-100 transition-colors transform group-hover:scale-110 duration-500">
            {icon}
          </div>
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-green-700 group-hover:text-green-800 transition-colors">
            {title}
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function WellnessCard({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  return (
    <Card className="nature-card h-full group overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-green-400 to-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-green-50 rounded-full group-hover:bg-green-100 transition-colors">
            {icon}
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-green-700 group-hover:text-green-800 transition-colors">
            {title}
          </h3>
          <p className="text-gray-700 text-sm sm:text-base">{content}</p>
        </div>
      </CardContent>
    </Card>
  )
}
