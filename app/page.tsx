"use client"

import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Utensils,
  Dumbbell,
  Brain,
  Users,
  Instagram,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
  BookOpen,
  Package,
  ExternalLink,
  Star,
  Zap,
  MessageCircle,
} from "lucide-react"
import { useState, useEffect } from "react"
import ReviewCarousel from "@/components/review-carousel"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface SubscriptionPage {
  id: string
  slug: string
  title: string
  subtitle: string
  hero_image_url: string
  status: string
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [subscriptionPages, setSubscriptionPages] = useState<SubscriptionPage[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [showTeamSection, setShowTeamSection] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedPageSlug, setSelectedPageSlug] = useState<string | null>(null)

  // Add scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Fetch subscription pages and team data, wrapped in try-catch
  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchSubscriptionPages()
        await fetchTeamData()
      } catch (error) {
        console.error("Failed to initialize data:", error)
        // Continue rendering even if data fetch fails
      }
    }
    initializeData()
  }, [])

  const fetchSubscriptionPages = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("subscription_pages")
        .select("id, slug, title, subtitle, hero_image_url, status")
        .eq("status", "published")
        .order("created_at")

      if (!error && data) {
        setSubscriptionPages(data)
      }
    } catch (error) {
      console.error("Error fetching subscription pages:", error)
      // Silently fail - page will render without subscription pages
    }
  }

  const fetchTeamData = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (!membersError && members) {
        setTeamMembers(members)
      }

      // Fetch visibility setting
      const { data: setting, error: settingError } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "show_our_team_section")
        .single()

      if (!settingError && setting) {
        setShowTeamSection(setting.setting_value)
      }
    } catch (error) {
      console.error("Error fetching team data:", error)
      // Silently fail - page will render without team section
    }
  }

  const handleExploreClick = (slug: string) => {
    window.location.href = `/user/subscription-categories/${slug}`
  }

  const handleEnroll = () => {
    // This function will be called when the "Attend 7 Days FREE" button is clicked.
    // You can add logic here to redirect the user or open a modal.
    console.log("Enroll button clicked")
    // Example: Redirect to registration page
    window.location.href = "/user/register"
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-emerald-50/20">
      <header
        className={`w-full py-4 px-6 sticky top-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-200" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center group">
            <div className="relative h-16 w-16 rounded-full overflow-hidden ring-1 ring-purple-200/40 group-hover:ring-purple-300/60 transition-all">
              <Image src="/images/logo.png" alt="Sthavishtah" fill className="object-cover" priority />
            </div>
            <div className="flex flex-col ml-3">
              <span className="font-playfair text-xl font-semibold tracking-tight text-purple-700">STHAVISHTAH</span>
              <span className="text-[10px] tracking-[0.2em] text-gray-500 uppercase">Yoga & Wellness</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/updates" className="text-sm text-gray-600 hover:text-gray-800 transition-colors font-lora">
              Updates
            </Link>
            <Link href="/user/login" className="text-sm text-gray-600 hover:text-gray-800 transition-colors font-lora">
              Sign In
            </Link>
            <Link
              href="/user/register"
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-teal-500 text-white text-sm rounded-full hover:from-purple-700 hover:to-teal-600 transition-all hover:shadow-lg font-lora"
            >
              Get Started
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-purple-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl shadow-lg border-t border-gray-200">
            <nav className="flex flex-col p-6 gap-4">
              <Link
                href="/updates"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-gray-900 py-2 font-lora"
              >
                Updates
              </Link>
              <Link
                href="/user/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-gray-900 py-2 font-lora"
              >
                Sign In
              </Link>
              <Link
                href="/user/register"
                onClick={() => setMobileMenuOpen(false)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-teal-500 text-white text-center rounded-full hover:from-purple-700 hover:to-teal-600 transition-all font-lora"
              >
                Get Started
              </Link>
            </nav>
          </div>
        )}
      </header>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/serene-forest-meditation.jpg"
            alt="Yoga Practice"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/60 via-emerald-800/50 to-stone-900/60"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
          <div className="mb-8">
            <div className="inline-block p-4 rounded-full bg-white/10 backdrop-blur-sm mb-6">
              <Image src="/images/logo.png" alt="Logo" width={100} height={100} className="rounded-full" />
            </div>
          </div>

          <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-tight select-none pointer-events-none">
            Return to Stillness.
            <br />
            <span className="font-semibold">Practice with Structure.</span>
          </h1>

          <p className="font-lora text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-10 leading-relaxed select-none">
            A structured yoga practice rooted in breath and awareness — designed to calm the mind, restore movement, and
            build lasting inner stability.
          </p>

          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-teal-500 hover:from-purple-700 hover:to-teal-600 text-white px-10 py-6 text-lg md:text-xl font-lora shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-xl hover:scale-105"
            onClick={handleEnroll}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="font-semibold">Attend 7 Days FREE</span>
              <span className="text-xs sm:text-sm font-normal opacity-90">
                Live sessions • No cost • Open to beginners
              </span>
            </div>
          </Button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/70 rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Combined Section - What You Will Gain + The Path We Follow */}
      <section className="min-h-screen py-8 md:py-12 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/riverside-yoga.jpg"
            alt="Peaceful Riverside Yoga"
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/80 via-emerald-800/70 to-emerald-900/80"></div>
        </div>

        <div className="container mx-auto px-4 relative">
          {/* What You Will Gain - Image */}
          <div className="text-center mb-8">
            <h2 className="font-playfair text-2xl md:text-4xl font-semibold text-white mb-4 drop-shadow-lg">
              What You Will Gain
            </h2>
            <div className="max-w-4xl mx-auto">
              <Image
                src="/images/chatgpt-20image-20feb-203-2c-202026-2c-2006-47-09-20pm.png"
                alt="What You Will Gain - Yoga Benefits including Karma Yoga, Astanga Yoga, Jnana Yoga, and Bhakti Yoga"
                width={1000}
                height={600}
                className="w-full h-auto rounded-xl shadow-2xl border-2 border-white/20"
                priority
              />
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center my-8">
            <div className="h-px w-24 bg-white/30"></div>
            <Sparkles className="h-6 w-6 text-white/60 mx-4" />
            <div className="h-px w-24 bg-white/30"></div>
          </div>

          {/* The Path We Follow */}
          <div className="text-center mb-6">
            <h2 className="font-playfair text-2xl md:text-3xl font-semibold text-white mb-2 drop-shadow-lg">
              The Path We Practiced and Passed On
            </h2>
            <p className="font-lora text-white/80 max-w-2xl mx-auto drop-shadow-md text-sm md:text-base">
              Holistic wellness practices inspired by nature's wisdom.
            </p>
          </div>

          <div className="max-w-6xl mx-auto overflow-x-auto scrollbar-hide">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pb-4">
              <Card className="border-white/20 hover:shadow-xl transition-all duration-300 group bg-white/95 backdrop-blur-sm rounded-xl">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-2.5 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors mb-3">
                      <BookOpen className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="font-playfair text-sm font-semibold text-emerald-800 leading-tight">Bhagavad Gita Study</h3>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-white/20 hover:shadow-xl transition-all duration-300 group bg-white/95 backdrop-blur-sm rounded-xl">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-2.5 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors mb-3">
                      <Users className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="font-playfair text-sm font-semibold text-emerald-800 leading-tight">Yoga for Health</h3>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-white/20 hover:shadow-xl transition-all duration-300 group bg-white/95 backdrop-blur-sm rounded-xl">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-2.5 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors mb-3">
                      <Dumbbell className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="font-playfair text-sm font-semibold text-emerald-800 leading-tight">Muscle Training</h3>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-white/20 hover:shadow-xl transition-all duration-300 group bg-white/95 backdrop-blur-sm rounded-xl">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-2.5 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors mb-3">
                      <Utensils className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="font-playfair text-sm font-semibold text-emerald-800 leading-tight">Natural Diet Plans</h3>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-white/20 hover:shadow-xl transition-all duration-300 group bg-white/95 backdrop-blur-sm rounded-xl">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-2.5 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors mb-3">
                      <Brain className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="font-playfair text-sm font-semibold text-emerald-800 leading-tight">Mental Wellness</h3>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-white/20 hover:shadow-xl transition-all duration-300 group bg-white/95 backdrop-blur-sm rounded-xl">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-2.5 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors mb-3">
                      <Calendar className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="font-playfair text-sm font-semibold text-emerald-800 leading-tight">Flexible Batches</h3>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Our Subscription Programs Section */}
      <section className="py-10 md:py-24 bg-gradient-to-br from-emerald-50 via-white to-purple-50/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-200 via-purple-300 to-emerald-200"></div>

        <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-purple-100/30 rounded-full -translate-y-1/2 translate-x-1/2 opacity-30 blur-3xl"></div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float-slow hidden md:block"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 20 + 15}s`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            >
              {i % 3 === 0 && <Star className="h-4 w-4 text-purple-300/30" />}
              {i % 3 === 1 && <Sparkles className="h-5 w-5 text-emerald-300/30" />}
              {i % 3 === 2 && <Zap className="h-4 w-4 text-yellow-300/30" />}
            </div>
          ))}
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-8 md:mb-16">
            <div className="inline-block px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full mb-4 shadow-sm border border-emerald-200">
              <Package className="inline-block mr-1 h-3 w-3 md:h-4 md:w-4" />
              Wellness Programs
            </div>
            <h2 className="font-playfair text-xl sm:text-2xl md:text-4xl font-bold mb-3 md:mb-4 text-emerald-800">
              Discover Our Transformative Programs
            </h2>
            <p className="text-center text-gray-600 max-w-2xl mx-auto text-sm md:text-base font-lora">
              Explore our carefully crafted subscription programs designed to nurture your mind, body, and spirit on
              your wellness journey.
            </p>
          </div>

          {subscriptionPages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12 max-w-5xl mx-auto">
              {subscriptionPages.map((page) => (
                <Card key={page.id} className="border border-emerald-200/60 hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl overflow-hidden">
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={page.hero_image_url || "/images/logo.png"}
                      alt={page.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-playfair text-lg font-semibold text-emerald-800 leading-tight mb-2">{page.title}</h3>
                    <p className="text-sm text-gray-600 font-lora leading-relaxed mb-4 line-clamp-2">{page.subtitle}</p>
                    <Button
                      onClick={() => handleExploreClick(page.slug)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      View Program
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12 max-w-5xl mx-auto">
              {/* Fallback cards with proper styling */}
              <Card className="border border-emerald-200/60 hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl overflow-hidden">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src="/images/logo.png"
                    alt="Yoga Basics"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-playfair text-lg font-semibold text-emerald-800 leading-tight mb-2">Sthavishtah Traditional Yoga Journey</h3>
                  <p className="text-sm text-gray-600 font-lora leading-relaxed mb-4 line-clamp-2">A Complete Yoga & Wellness Experience from the Comfort of Your Home</p>
                  <Link href="/plans">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      View Program
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border border-emerald-200/60 hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl overflow-hidden">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src="/images/traditional-yoga-mudras.jpg"
                    alt="Mindful Meditation"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-playfair text-lg font-semibold text-emerald-800 leading-tight mb-2">Mindful Meditation</h3>
                  <p className="text-sm text-gray-600 font-lora leading-relaxed mb-4 line-clamp-2">Deepen your practice with guided meditation sessions for mental clarity and inner peace.</p>
                  <Link href="/plans">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      View Program
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border border-emerald-200/60 hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl overflow-hidden">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src="/images/riverside-yoga.jpg"
                    alt="Complete Wellness"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-playfair text-lg font-semibold text-emerald-800 leading-tight mb-2">Complete Wellness</h3>
                  <p className="text-sm text-gray-600 font-lora leading-relaxed mb-4 line-clamp-2">A comprehensive program combining yoga, meditation, and nutrition for total well-being.</p>
                  <Link href="/plans">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      View Program
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}

          {/* CTA Button */}
          <div className="text-center">
            <Link href="/plans">
              <Button
                size="lg"
                className="group bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 md:px-8 relative overflow-hidden text-sm md:text-base"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative z-10">Explore All Programs</span>
                <ExternalLink className="ml-2 h-4 w-4 md:h-5 md:w-5 relative z-10" />
              </Button>
            </Link>
            <p className="text-xs md:text-sm text-gray-500 mt-3 md:mt-4">
              Browse all programs without signing up. Login or register when you're ready to subscribe.
            </p>
          </div>
        </div>
      </section>

      {showTeamSection && teamMembers.length > 0 && (
        <section className="py-14 md:py-20 relative overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 -z-10">
            <Image
              src="/yoga-studio-peaceful-atmosphere.jpg"
              alt="Team Background"
              fill
              className="object-cover object-center"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-green-800/85 to-teal-800/90"></div>
          </div>

          {/* Decorative Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0ySDZ6bT0iLz48L2c+PC9nPjwvc3ZnPg==')] -z-10"></div>

          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-medium mb-4 shadow-md border border-white/20">
                <Users className="inline-block mr-1 h-4 w-4" />
                Our Team
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4 text-white drop-shadow-lg">
                Meet Our Dedicated Instructors
              </h2>
              <p className="text-white/90 max-w-2xl mx-auto drop-shadow-md mb-6">
                Experienced practitioners committed to guiding your wellness journey with wisdom and compassion.
              </p>
            </div>

            {/* Desktop view - show first 6 members */}
            <div className="hidden lg:block relative">
              <div className="grid lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
                {teamMembers.slice(0, 6).map((member, index) => (
                  <div key={member.id} className="relative z-10">
                    <div className="transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-white/20">
                      <div className="relative mb-4">
                        <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border-4 border-white/30 shadow-xl hover:border-white/50 transition-all duration-200">
                          <Image
                            src={member.image_url || "/placeholder.svg"}
                            alt={member.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-white font-semibold text-base drop-shadow-md">{member.name}</h3>
                        <p className="text-white/80 text-sm mt-1 drop-shadow-sm">{member.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile and Tablet view - show first 4 members */}
            <div className="lg:hidden">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-6 pb-4 md:gap-8" style={{ width: "calc(400% + 1.5rem)" }}>
                  {teamMembers.slice(0, 4).map((member) => (
                    <div key={member.id} className="flex-shrink-0 w-full text-center relative">
                      <div className="transition-all duration-200 hover:scale-105">
                        <div className="relative mb-4">
                          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full overflow-hidden border-4 border-white/30 shadow-xl hover:border-white/50 transition-all duration-200">
                            <Image
                              src={member.image_url || "/placeholder.svg"}
                              alt={member.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div className="text-center">
                          <h3 className="text-white font-semibold text-sm md:text-base drop-shadow-md">
                            {member.name}
                          </h3>
                          <p className="text-white/80 text-sm md:text-sm mt-1 drop-shadow-sm">{member.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center mt-4 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? "bg-white/60" : "bg-white/30"}`}></div>
                ))}
              </div>
            </div>

            <div className="text-center mt-12">
              <Link href="/our-team">
                <Button
                  size="lg"
                  className="bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white border-2 border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 px-8"
                >
                  Explore Our Team
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="relative py-6 md:py-12 overflow-hidden">
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
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0ySDZ6bT0iLz48L2c+PC9nPjwvc3ZnPg==')] -z-10"></div>

        <div className="container mx-auto px-4 text-center">
          <div className="inline-block mb-3 md:mb-4 px-3 sm:px-4 bg-white/15 backdrop-blur-sm rounded-full text-white font-medium border border-white/20 shadow-lg text-xs md:text-sm">
            <Star className="inline-block h-3 w-3 md:h-4 md:w-4 mr-1 animate-pulse" />
            What Our Students Say
          </div>

          <h2 className="text-base sm:text-lg md:text-2xl font-bold mb-2 md:mb-4 text-white drop-shadow-lg">
            Transformative Experiences from Our Community
          </h2>

          <p className="text-sm md:text-lg mb-4 md:mb-6 text-white/90 drop-shadow-lg max-w-xl mx-auto">
            Discover how our practices have changed lives.
          </p>

          <div className="max-w-6xl mx-auto">
            <ReviewCarousel />
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-gradient-to-b from-emerald-50/30 to-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-playfair text-2xl sm:text-3xl font-semibold text-emerald-800 mb-2 sm:mb-3">
              Flexible Batches
            </h2>
            <p className="font-lora text-sm text-emerald-700/70 max-w-xl mx-auto px-4">
              Choose from our flexible schedule designed to harmonize with your natural rhythms.
            </p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {/* Morning Batch */}
            <div className="border-emerald-200/40 hover:shadow-lg transition-all duration-300">
              <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-400"></div>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="p-2 rounded-full bg-yellow-100">
                    <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                  </div>
                  <h3 className="font-playfair text-lg sm:text-xl font-semibold text-emerald-800">Morning Batches</h3>
                </div>
                <div className="space-y-2 mb-4">
                  {[{ time: "5:30 AM - 6:30 AM" }, { time: "6:40 AM - 7:40 AM" }, { time: "7:50 AM - 8:50 AM" }].map(
                    (slot, i) => (
                      <div key={i} className="flex items-center p-2 bg-amber-50/50 rounded-lg">
                        <span className="font-lora font-semibold text-emerald-800 text-sm">{slot.time}</span>
                      </div>
                    ),
                  )}
                </div>
                <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50 text-xs">
                  Energizing Flow
                </Badge>
              </CardContent>
            </div>

            {/* Evening Batch */}
            <div className="border-emerald-200/40 hover:shadow-lg transition-all duration-300">
              <div className="h-1 bg-gradient-to-r from-indigo-400 to-purple-400"></div>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="p-2 rounded-full bg-indigo-100">
                    <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                  </div>
                  <h3 className="font-playfair text-lg sm:text-xl font-semibold text-emerald-800">Evening Batches</h3>
                </div>
                <div className="space-y-2 mb-4">
                  {[{ time: "5:30 PM - 6:30 PM" }, { time: "6:40 PM - 7:40 PM" }, { time: "7:50 PM - 8:50 PM" }].map(
                    (slot, i) => (
                      <div key={i} className="flex items-center p-2 bg-stone-50 rounded-lg">
                        <span className="font-lora font-semibold text-emerald-800 text-sm">{slot.time}</span>
                      </div>
                    ),
                  )}
                </div>
                <Badge variant="outline" className="border-indigo-300 text-indigo-700 bg-indigo-50 text-xs">
                  Calming Practice
                </Badge>
              </CardContent>
            </div>
          </div>
        </div>
      </section>
      <section className="py-10 md:py-14 bg-gradient-to-br from-emerald-50 via-white to-teal-50/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-4">
              <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium mb-3">
                Join Our Community
              </span>
              <h2 className="font-playfair text-2xl md:text-3xl font-semibold text-emerald-800 mb-3">
                Connect, Share, and Grow Together
              </h2>
              <p className="font-lora text-sm md:text-base text-emerald-700/80 mb-6 max-w-xl mx-auto">
                Join yoga enthusiasts in our WhatsApp community. Share your journey, get daily inspiration, and connect
                with like-minded souls on the path to wellness.
              </p>
            </div>

            <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 border border-emerald-100">
              <MessageCircle className="h-5 w-5 text-green-600" />
              <a
                href="https://whatsapp.com/channel/0029Vb6wVWi0lwgtLZg26b04"
                target="_blank"
                rel="noopener noreferrer"
                className="font-lora font-medium text-emerald-800 hover:text-emerald-600 transition-colors text-sm md:text-base"
              >
                Join WhatsApp Community
              </a>
              <ArrowRight className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
        </div>
      </section>
      <footer className="bg-gradient-to-r from-purple-800 via-purple-700 to-teal-600 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Brand Column */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative h-14 w-14 rounded-full overflow-hidden">
                  <Image src="/images/logo.png" alt="Sthavishtah" fill className="object-cover" />
                </div>
                <span className="font-playfair text-xl font-semibold">STHAVISHTAH YOGA</span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-4">
                Nurturing mind, body, and spirit through authentic yoga practices and natural wellness approaches.
              </p>
              <p className="text-white/60 text-xs">© 2026 STHAVISHTAH YOGA. All rights reserved.</p>
            </div>

            {/* Contact Column */}
            <div>
              <h3 className="font-playfair text-lg font-semibold mb-4">Contact Us</h3>
              <div className="space-y-3 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-white/80">Email:</span>
                  <span className="text-white">sthavishtah2024@gmail.com</span>
                </p>
                <p className="flex items-start gap-2">
                  <Instagram className="w-4 h-4 mt-0.5 text-white/80" />
                  <span className="text-white">@sthavishtah</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-white/80">Address:</span>
                  <span className="text-white">Bengaluru, India</span>
                </p>
              </div>
            </div>

            {/* Quick Links Column */}
            <div>
              <h3 className="font-playfair text-lg font-semibold mb-4">Quick Links</h3>
              <nav className="space-y-2 text-sm">
                <Link href="/user/login" className="flex items-center gap-2 hover:text-white/80 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                  Login
                </Link>
                <Link href="/user/register" className="flex items-center gap-2 hover:text-white/80 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                  Register
                </Link>
                <Link href="/instructors" className="flex items-center gap-2 hover:text-white/80 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                  Instructors
                </Link>
                <Link href="/admin" className="flex items-center gap-2 hover:text-white/80 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                  Admin
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function BatchTime({ number, time, isNew = false }) {
  return (
    <div className="flex items-center p-3 sm:p-4 border rounded-lg bg-gradient-to-r from-green-50/80 to-emerald-50/80 hover:from-green-100/80 hover:to-emerald-100/80 transition-colors shadow-sm group border-green-100 hover:border-green-200">
      <span className="mr-3 sm:mr-4 px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-sm group-hover:from-green-700 group-hover:to-emerald-700 transition-colors">
        BATCH {number}
      </span>
      <span className="font-medium text-green-800 text-sm sm:text-base">{time}</span>
      {isNew && (
        <span className="ml-auto bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs px-2 py-1 rounded-full animate-pulse shadow-sm">
          New
        </span>
      )}
    </div>
  )
}

function OfferingCard({ icon, title, description }) {
  return (
    <div className="flex-shrink-0 w-72 snap-center border-emerald-200/40 hover:shadow-lg transition-all duration-300 group bg-white/90 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-3">
          <div className="p-2.5 rounded-full bg-emerald-50 group-hover:bg-emerald-100 transition-colors flex-shrink-0">
            {icon}
          </div>
          <h3 className="font-playfair text-lg font-semibold text-emerald-800 leading-tight">{title}</h3>
        </div>
        <p className="text-sm text-emerald-700/70 font-lora leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function WellnessCard({ icon, title, content }) {
  return (
    <div className="nature-card h-full group overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border-0 bg-white/95 backdrop-blur-sm">
      <div className="h-1 bg-gradient-to-r from-green-400 to-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
      <div className="pt-6 pb-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full group-hover:from-green-100 group-hover:to-emerald-100 transition-colors shadow-md">
            {icon}
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-emerald-700 group-hover:from-green-800 group-hover:to-emerald-800 transition-colors">
            {title}
          </h3>
          <p className="text-gray-700 text-sm sm:text-base">{content}</p>
        </div>
      </div>
    </div>
  )
}
