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
  Leaf,
  Sun,
  Moon,
  Menu,
  X,
  Heart,
  Sparkles,
  BookOpen,
  Package,
  ExternalLink,
  Star,
  Zap,
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

  // Fetch subscription pages
  useEffect(() => {
    fetchSubscriptionPages()
    fetchTeamData()
  }, [])

  const fetchSubscriptionPages = async () => {
    const supabase = getSupabaseBrowserClient()
    try {
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
    }
  }

  const fetchTeamData = async () => {
    const supabase = getSupabaseBrowserClient()
    try {
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
    }
  }

  const handleExploreClick = (slug: string) => {
    window.location.href = `/plans/${slug}`
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-emerald-50/20">
      <header
        className={`w-full py-4 px-6 sticky top-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-emerald-100/40" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-12 w-12 rounded-full overflow-hidden ring-1 ring-emerald-200/40 group-hover:ring-emerald-300/60 transition-all">
              <Image src="/images/logo.png" alt="Sthavishtah" fill className="object-cover" priority />
            </div>
            <div className="flex flex-col">
              <span className="font-playfair text-xl font-semibold tracking-tight text-emerald-800">STHAVISHTAH</span>
              <span className="text-[10px] tracking-[0.2em] text-emerald-700/50 uppercase">Yoga & Wellness</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/updates"
              className="text-sm text-emerald-700/60 hover:text-emerald-800 transition-colors font-lora"
            >
              Updates
            </Link>
            <Link
              href="/user/login"
              className="text-sm text-emerald-700/60 hover:text-emerald-800 transition-colors font-lora"
            >
              Sign In
            </Link>
            <Link
              href="/user/register"
              className="px-6 py-2.5 bg-teal-600 text-white text-sm rounded-full hover:bg-teal-700 transition-all hover:shadow-lg font-lora"
            >
              Get Started
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-emerald-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl shadow-lg border-t border-emerald-100/40">
            <nav className="flex flex-col p-6 gap-4">
              <Link
                href="/updates"
                onClick={() => setMobileMenuOpen(false)}
                className="text-emerald-700 hover:text-emerald-800 py-2 font-lora"
              >
                Updates
              </Link>
              <Link
                href="/user/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-emerald-700 hover:text-emerald-800 py-2 font-lora"
              >
                Sign In
              </Link>
              <Link
                href="/user/register"
                onClick={() => setMobileMenuOpen(false)}
                className="px-6 py-3 bg-teal-600 text-white text-center rounded-full hover:bg-teal-700 transition-all font-lora"
              >
                Get Started
              </Link>
            </nav>
          </div>
        )}
      </header>

      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/serene-forest-meditation.jpg"
            alt="Yoga Practice"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 via-emerald-800/40 to-stone-900/50"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
          <div className="mb-8">
            <div className="inline-block p-4 rounded-full bg-white/10 backdrop-blur-sm mb-6">
              <Image src="/images/logo.png" alt="Logo" width={100} height={100} className="rounded-full" />
            </div>
          </div>

          <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-tight">
            Return to Stillness.
            <br />
            <span className="font-semibold">Return to Yourself.</span>
          </h1>

          <p className="font-lora text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed">
            A gentle, guided yoga and wellness practice rooted in breath, awareness, and balance — designed to help you
            slow down, soften the body, and steady the mind.
          </p>
        </div>
      </section>

      <section className="py-12 bg-amber-50/40">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <h2 className="font-playfair text-2xl md:text-3xl font-semibold text-emerald-800 mb-8">
            Sthavishtah Yoga and Wellness
          </h2>
          <Link
            href="/user/register"
            className="inline-flex items-center gap-2 px-10 py-4 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all hover:shadow-xl font-lora text-lg mb-4"
          >
            Begin Your 7 Days Free Practice
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="font-lora text-emerald-700/60 italic text-base">A quiet beginning, at your own pace</p>
        </div>
      </section>

      <section className="py-12 bg-white border-y border-emerald-100/40">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-playfair text-2xl md:text-3xl font-semibold text-emerald-800 mb-2">
            BREATHE, BALANCE, BECOME
          </h2>
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-16 bg-emerald-200"></div>
            <Sparkles className="h-5 w-5 text-emerald-500" />
            <div className="h-px w-16 bg-emerald-200"></div>
          </div>
          <p className="font-lora text-emerald-700/70 text-lg">Next batch starting from December 1, 2025</p>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-white to-amber-50/30">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
              Our Schedule
            </span>
            <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-emerald-800 mb-4">Flexible Batches</h2>
            <p className="font-lora text-emerald-700/70 max-w-2xl mx-auto">
              Choose from our flexible schedule designed to harmonize with your natural rhythms.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Morning Batch */}
            <Card className="border-emerald-200/40 hover:shadow-xl transition-all duration-300 group">
              <div className="h-1.5 bg-gradient-to-r from-yellow-400 to-orange-400"></div>
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <Sun className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="font-playfair text-2xl font-semibold text-emerald-800">Morning Batches</h3>
                </div>
                <div className="space-y-3 mb-6">
                  {[
                    { time: "5:30 AM - 6:30 AM", desc: "Early dawn practice" },
                    { time: "6:40 AM - 7:40 AM", desc: "Sunrise session" },
                    { time: "7:50 AM - 8:50 AM", desc: "Morning flow" },
                  ].map((slot, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-amber-50/50 rounded-lg">
                      <span className="font-lora text-emerald-800 font-medium">{slot.time}</span>
                      <span className="text-sm text-emerald-700/60">{slot.desc}</span>
                    </div>
                  ))}
                </div>
                <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">
                  Energizing Flow
                </Badge>
              </CardContent>
            </Card>

            {/* Evening Batch */}
            <Card className="border-emerald-200/40 hover:shadow-xl transition-all duration-300 group">
              <div className="h-1.5 bg-gradient-to-r from-indigo-400 to-purple-400"></div>
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-full bg-indigo-100">
                    <Moon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="font-playfair text-2xl font-semibold text-emerald-800">Evening Batches</h3>
                </div>
                <div className="space-y-3 mb-6">
                  {[
                    { time: "5:30 PM - 6:30 PM", desc: "Evening unwind" },
                    { time: "6:40 PM - 7:40 PM", desc: "Wind-down practice" },
                    { time: "7:50 PM - 8:50 PM", desc: "Restorative session" },
                  ].map((slot, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-stone-50 rounded-lg">
                      <span className="font-lora text-emerald-800 font-medium">{slot.time}</span>
                      <span className="text-sm text-emerald-700/60">{slot.desc}</span>
                    </div>
                  ))}
                </div>
                <Badge variant="outline" className="border-indigo-300 text-indigo-700 bg-indigo-50">
                  Calming Practice
                </Badge>
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
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwNDdBMzgiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0ySDZ6T00iLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50 -z-10"></div>

        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent"></div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-8">
            <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-emerald-800 mb-3">
              The Path We Practiced and Passed On
            </h2>
            <p className="font-lora text-emerald-700/70 max-w-2xl mx-auto">
              Holistic wellness practices inspired by nature's wisdom.
            </p>
          </div>

          <div className="max-w-6xl mx-auto overflow-x-auto">
            <div className="flex gap-6 pb-4 snap-x snap-mandatory">
              <OfferingCard
                icon={<BookOpen className="h-7 w-7 text-emerald-600" />}
                title="Bhagavad Gita Study"
                description="Discover timeless wisdom through our Gita practice sessions starting now."
              />
              <OfferingCard
                icon={<Users className="h-7 w-7 text-emerald-600" />}
                title="Yoga for Health & Flexibility"
                description="Gentle practices to improve mobility, reduce stress, and enhance your connection."
              />
              <OfferingCard
                icon={<Dumbbell className="h-7 w-7 text-emerald-600" />}
                title="Light Muscle Training"
                description="Strengthen your body with movements inspired by natural forms."
              />
              <OfferingCard
                icon={<Utensils className="h-7 w-7 text-emerald-600" />}
                title="Natural Diet Plans"
                description="Nourish your body with seasonal, wholesome nutrition plans."
              />
              <OfferingCard
                icon={<Brain className="h-7 w-7 text-emerald-600" />}
                title="Mental Wellness Sessions"
                description="Forest-inspired meditation and mindfulness practices."
              />
              <OfferingCard
                icon={<Calendar className="h-7 w-7 text-emerald-600" />}
                title="Flexible Batches"
                description="Join any of our six daily sessions that align with your rhythm."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Explore Our Subscription Programs Section */}
      <section className="py-10 md:py-24 bg-gradient-to-br from-white via-purple-50/20 to-emerald-50/20 relative overflow-hidden">
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
            <div className="inline-block px-3 py-1 md:px-4 md:py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-xs md:text-sm font-medium mb-3 md:mb-4 shadow-md">
              <Package className="inline-block mr-1 h-3 w-3 md:h-4 md:w-4" />
              Wellness Programs
            </div>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-3 md:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-purple-800 to-emerald-800">
              Discover Our Transformative Programs
            </h2>
            <p className="text-center text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
              Explore our carefully crafted subscription programs designed to nurture your mind, body, and spirit on
              your wellness journey.
            </p>
          </div>

          {subscriptionPages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
              {subscriptionPages.map((page, index) => (
                <Card
                  key={page.id}
                  className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white/90 backdrop-blur-sm"
                >
                  <div
                    className="h-32 md:h-48 bg-cover bg-center relative"
                    style={{
                      backgroundImage: page.hero_image_url
                        ? `url('${page.hero_image_url}')`
                        : `url('/placeholder.svg?height=200&width=400')`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/70 transition-all duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-300"></div>
                    <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 text-white">
                      <Badge className="bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-sm mb-1 md:mb-2 text-white border-0 shadow-md text-xs">
                        Available Now
                      </Badge>
                      <h3 className="text-sm md:text-xl font-bold drop-shadow-lg">{page.title}</h3>
                    </div>
                  </div>
                  <CardContent className="p-3 md:p-6">
                    <p className="text-gray-600 mb-3 md:mb-6 line-clamp-2 text-xs md:text-base">{page.subtitle}</p>
                    <div className="flex justify-center">
                      <Button
                        onClick={() => handleExploreClick(page.slug)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-4 py-2 md:px-6 md:py-2 shadow-md hover:shadow-lg transition-all duration-300 text-xs md:text-sm"
                      >
                        Explore Program
                        <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
              {/* Fallback cards with mobile optimizations */}
              <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white/90 backdrop-blur-sm">
                <div
                  className="h-32 md:h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: "url('/images/serene-forest-meditation.jpg')" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/70 transition-all duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-all duration-300"></div>
                  <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 text-white">
                    <Badge className="bg-green-500/90 backdrop-blur-sm mb-1 md:mb-2 text-white border-0 shadow-md text-xs">
                      Beginner Friendly
                    </Badge>
                    <h3 className="text-sm md:text-xl font-bold drop-shadow-lg">Yoga Basics</h3>
                  </div>
                </div>
                <CardContent className="p-3 md:p-6">
                  <p className="text-gray-600 mb-3 md:mb-6 text-xs md:text-base">
                    Perfect for beginners starting their yoga journey with gentle poses and breathing techniques.
                  </p>
                  <div className="flex justify-center">
                    <Button
                      onClick={() => handleExploreClick("yoga-basics")}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-4 py-2 md:px-6 md:py-2 shadow-md hover:shadow-lg transition-all duration-300 text-xs md:text-sm"
                    >
                      Explore Program
                      <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white/90 backdrop-blur-sm">
                <div
                  className="h-32 md:h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: "url('/images/traditional-yoga-mudras.jpg')" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/70 transition-all duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 group-hover:from-yellow-500/30 group-hover:to-orange-500/30 transition-all duration-300"></div>
                  <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 text-white">
                    <Badge className="bg-yellow-500/90 backdrop-blur-sm mb-1 md:mb-2 text-white border-0 shadow-md text-xs">
                      Intermediate
                    </Badge>
                    <h3 className="text-sm md:text-xl font-bold drop-shadow-lg">Mindful Meditation</h3>
                  </div>
                </div>
                <CardContent className="p-3 md:p-6">
                  <p className="text-gray-600 mb-3 md:mb-6 text-xs md:text-base">
                    Deepen your practice with guided meditation sessions for mental clarity and inner peace.
                  </p>
                  <div className="flex justify-center">
                    <Button
                      onClick={() => handleExploreClick("mindful-meditation")}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-4 py-2 md:px-6 md:py-2 shadow-md hover:shadow-lg transition-all duration-300 text-xs md:text-sm"
                    >
                      Explore Program
                      <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white/90 backdrop-blur-sm">
                <div
                  className="h-32 md:h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: "url('/images/riverside-yoga.jpg')" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/70 transition-all duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-300"></div>
                  <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 text-white">
                    <Badge className="bg-purple-500/90 backdrop-blur-sm mb-1 md:mb-2 text-white border-0 shadow-md text-xs">
                      Holistic
                    </Badge>
                    <h3 className="text-sm md:text-xl font-bold drop-shadow-lg">Complete Wellness</h3>
                  </div>
                </div>
                <CardContent className="p-3 md:p-6">
                  <p className="text-gray-600 mb-3 md:mb-6 text-xs md:text-base">
                    A comprehensive program combining yoga, meditation, and nutrition for total well-being.
                  </p>
                  <div className="flex justify-center">
                    <Button
                      onClick={() => handleExploreClick("complete-wellness")}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-4 py-2 md:px-6 md:py-2 shadow-md hover:shadow-lg transition-all duration-300 text-xs md:text-sm"
                    >
                      Explore Program
                      <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
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

      {/* Features Grid - Enhanced with better cards */}
      <section className="py-14 md:py-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-50 rounded-full opacity-70"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-50 rounded-full opacity-70"></div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-100 text-emerald-800 text-sm font-medium mb-4 shadow-md">
              <Heart className="inline-block mr-1 h-4 w-4" />
              Our Approach
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-emerald-700">
              The True Essence of Yoga
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-8 md:p-12 rounded-2xl shadow-lg border border-emerald-100">
              <div className="text-center mb-8">
                <h3 className="text-xl md:text-2xl font-bold text-emerald-800 mb-4 italic">"योगश्चित्तवृत्तिनिरोधः"</h3>
                <p className="text-lg md:text-xl text-emerald-700 font-semibold mb-6">
                  "Yoga is Chitta Vritti Nirodha"
                </p>
                <p className="text-sm md:text-base text-gray-600 mb-8">- Patanjali's Yoga Sutras (1.2)</p>
              </div>

              <div className="prose prose-green max-w-none text-center">
                {/* Desktop view - full content */}
                <div className="hidden md:block">
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-6">
                    At Sthavishtah, we honor this timeless wisdom that defines yoga as the cessation of mental
                    fluctuations. Our platform is unique because we don't just teach physical postures - we guide you
                    toward the true purpose of yoga: achieving a state of inner stillness and self-realization.
                  </p>

                  <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-6">
                    Unlike modern fitness-focused approaches, we embrace yoga's authentic spiritual dimension. Through
                    traditional practices, Bhagavad Gita study, and mindful living, we help you transcend the constant
                    chatter of the mind and discover your true nature.
                  </p>

                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    Our revolutionary approach combines ancient wisdom with modern accessibility, creating
                    transformative experiences that awaken your highest potential. We don't just practice yoga - we live
                    it, breathe it, and embody the true essence of yoga as a complete way of life. This is not just
                    exercise - this is the path to liberation, exactly as the great sages intended.
                  </p>
                </div>

                {/* Mobile view - sliding content */}
                <div className="md:hidden">
                  <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-4 pb-4" style={{ width: "calc(300% + 2rem)" }}>
                      <div className="flex-shrink-0 w-full bg-white/50 p-4 rounded-lg border border-emerald-100">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          At Sthavishtah, we honor the timeless wisdom that defines yoga as the cessation of mental
                          fluctuations. We guide you toward achieving inner stillness and self-realization.
                        </p>
                      </div>
                      <div className="flex-shrink-0 w-full bg-white/50 p-4 rounded-lg border border-emerald-100">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Unlike modern fitness approaches, we embrace yoga's authentic spiritual dimension through
                          traditional practices, Bhagavad Gita study, and mindful living.
                        </p>
                      </div>
                      <div className="flex-shrink-0 w-full bg-white/50 p-4 rounded-lg border border-emerald-100">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Our revolutionary approach combines ancient wisdom with modern accessibility, creating
                          transformative experiences. This is the path to liberation as the great sages intended.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center mt-4 gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-emerald-200 rounded-full"></div>
                    <div className="w-2 h-2 bg-emerald-200 rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Leaf className="h-5 w-5" />
                  <span className="text-sm font-medium">Authentic • Traditional • Transformative</span>
                  <Leaf className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
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
              <span className="inline-block px-4 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-medium mb-4 shadow-md border border-white/20">
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
                  <div key={member.id} className="cursor-pointer relative z-10">
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
                    <div key={member.id} className="flex-shrink-0 w-full text-center cursor-pointer relative">
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
          <div className="inline-block mb-3 md:mb-4 px-3 py-1 md:px-4 md:py-1 bg-white/15 backdrop-blur-sm rounded-full text-white font-medium border border-white/20 shadow-lg text-xs md:text-sm">
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
            <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-sm font-medium mb-4 shadow-md">
              <Users className="inline-block mr-1 h-4 w-4" />
              Connect with Us
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-800 to-emerald-700">
              Join Our Wellness Community
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Connect with like-minded souls on a journey of self-discovery and natural wellness.
            </p>
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 p-8 md:p-12 rounded-2xl shadow-lg border border-green-100 mb-8">
              <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-6">
                Join our WhatsApp community for daily updates, motivation, and direct connection with instructors and
                fellow practitioners.
              </p>

              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center transform transition-transform hover:scale-105 duration-300 border border-green-100">
                  <div className="text-green-800 font-bold mb-2 text-center text-sm">SCAN FOR WHATSAPP CHANNEL</div>
                  <div className="h-24 w-24 md:h-32 md:w-32 relative rounded-lg overflow-hidden shadow-inner">
                    <Image src="/images/wpqr1.jpeg" alt="WhatsApp Channel QR Code" fill className="object-contain" />
                  </div>
                </div>
              </div>

              <p className="text-sm md:text-base text-gray-600 mb-6">
                Quiet your mind, strengthen your body, awaken your spirit. Start your yoga journey today!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/user/register"
                  className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Join Our Journey
                  <Leaf className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="https://chat.whatsapp.com/G68uJzPssx1CZE2WphRmzP"
                  target="_blank"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-teal-700 border border-teal-200 hover:bg-teal-50 hover:border-teal-300 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Join WhatsApp
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Enhanced with better styling */}
      <footer className="bg-gradient-to-br from-teal-800 to-teal-700 text-white py-14 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0ySDZ6bT0iLz48L2c+PC9nPjwvc3ZnPg==')] -z-10"></div>

        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            <div>
              <div className="flex items-center mb-5 md:mb-6">
                <div className="relative h-10 w-10 sm:h-12 sm:w-12 mr-3 sm:mr-4 rounded-full overflow-hidden border border-white/20 shadow-lg">
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
                    href="/instructor/login"
                    className="text-gray-300 hover:text-white transition-colors flex items-center text-sm sm:text-base group"
                  >
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:translate-x-1 transition-transform" />
                    Instructors
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
    <div className="flex items-center p-3 sm:p-4 border rounded-lg bg-gradient-to-r from-green-50/80 to-emerald-50/80 hover:from-green-100/80 hover:to-emerald-100/80 transition-colors shadow-sm group border-green-100 hover:border-green-200">
      <Badge
        variant="outline"
        className="mr-3 sm:mr-4 px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-sm group-hover:from-green-700 group-hover:to-emerald-700 transition-colors"
      >
        BATCH {number}
      </Badge>
      <span className="font-medium text-green-800 text-sm sm:text-base">{time}</span>
      {isNew && (
        <span className="ml-auto bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs px-2 py-1 rounded-full animate-pulse shadow-sm">
          New
        </span>
      )}
    </div>
  )
}

// Updated OfferingCard component
function OfferingCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="flex-shrink-0 w-72 snap-center border-emerald-200/40 hover:shadow-lg transition-all duration-300 group bg-white/90 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-3">
          <div className="p-2.5 rounded-full bg-emerald-50 group-hover:bg-emerald-100 transition-colors flex-shrink-0">
            {icon}
          </div>
          <h3 className="font-playfair text-lg font-semibold text-emerald-800 leading-tight">{title}</h3>
        </div>
        <p className="text-sm text-emerald-700/70 font-lora leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}

function WellnessCard({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  return (
    <Card className="nature-card h-full group overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border-0 bg-white/95 backdrop-blur-sm">
      <div className="h-1 bg-gradient-to-r from-green-400 to-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full group-hover:from-green-100 group-hover:to-emerald-100 transition-colors shadow-md">
            {icon}
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-emerald-700 group-hover:from-green-800 group-hover:to-emerald-800 transition-colors">
            {title}
          </h3>
          <p className="text-gray-700 text-sm sm:text-base">{content}</p>
        </div>
      </CardContent>
    </Card>
  )
}
