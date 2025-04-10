import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Calendar, Utensils, Dumbbell, Brain, Users, Instagram } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* White stripe header */}
      <header className="w-full bg-white py-3 px-4 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center">
          <div className="relative h-10 w-10 mr-3">
            <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" priority />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight">STHAVISHTAH</span>
            <span className="text-xs tracking-widest text-muted-foreground">YOGA AND WELLNESS</span>
          </div>
          <div className="ml-auto flex gap-4">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-100 text-purple-700 border-purple-200 font-medium"
            >
              <Link href="/user/login">Login</Link>
            </Button>
            <Button asChild size="sm" className="bg-purple-700 hover:bg-purple-800 text-white font-medium">
              <Link href="/user/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-bg text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative h-24 w-24 bg-white rounded-full p-2">
              <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" priority />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">STHAVISHTAH YOGA AND WELLNESS</h1>
          <p className="text-xl md:text-2xl mb-6 max-w-3xl mx-auto">Welcome to STHAVISHTAH – Your Path to Wellness!</p>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            We offer yoga and wellness training to help you achieve physical and mental well-being.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-purple-700 hover:bg-gray-100 font-semibold shadow-lg">
              <Link href="/user/register">Register Now</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-purple-200 text-purple-900 border-2 border-white hover:bg-purple-300 font-semibold shadow-lg"
            >
              <Link href="/user/login">Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Tagline Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">ALIGN YOUR MIND, NOURISH YOUR SOUL</h2>
          <p className="text-xl text-purple-600 font-semibold">Sessions starting from April 1, 2025</p>
        </div>
      </section>

      {/* Batch Schedule Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Batches</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Morning Batches */}
            <Card className="border-purple-200 shadow-md">
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold text-center mb-4 text-purple-700">Morning Batch</h3>
                <div className="space-y-4">
                  <BatchTime number="1" time="5:30 - 6:30" />
                  <BatchTime number="2" time="6:40 - 7:40" />
                  <BatchTime number="3" time="7:50 - 8:50" />
                </div>
              </CardContent>
            </Card>

            {/* Evening Batches */}
            <Card className="border-indigo-200 shadow-md">
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold text-center mb-4 text-indigo-700">Evening Batch</h3>
                <div className="space-y-4">
                  <BatchTime number="4" time="5:30 - 6:30" />
                  <BatchTime number="5" time="6:40 - 7:40" />
                  <BatchTime number="6" time="7:50 - 8:50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Offerings Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Offerings</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <OfferingCard
              icon={<Calendar className="h-10 w-10 text-purple-600" />}
              title="Flexible Batches"
              description="We have six daily sessions, and you can attend any session that fits your schedule. The links will be shared in our community."
            />
            <OfferingCard
              icon={<Users className="h-10 w-10 text-purple-600" />}
              title="Yoga for Health & Flexibility"
              description="Improve mobility, reduce stress, and enhance overall well-being."
            />
            <OfferingCard
              icon={<Dumbbell className="h-10 w-10 text-purple-600" />}
              title="Light Muscle Training"
              description="Strengthen and tone muscles for a healthier body."
            />
            <OfferingCard
              icon={<Utensils className="h-10 w-10 text-purple-600" />}
              title="Customized Diet Plans"
              description="We provide tailored nutrition plans to support your weight loss transformation."
            />
            <OfferingCard
              icon={<Brain className="h-10 w-10 text-purple-600" />}
              title="Mental Wellness Sessions"
              description="Special sessions to help you manage stress, improve focus, and achieve emotional balance."
            />
            <OfferingCard
              icon={<CheckCircle className="h-10 w-10 text-purple-600" />}
              title="Orientation Sessions"
              description="Get guidance on how to begin your wellness journey with us."
            />
          </div>
        </div>
      </section>

      {/* Promotion Section */}
      <section className="hero-bg text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">JOIN NOW FOR THE FREE SESSIONS FOR 2 MONTHS</h2>
          <p className="text-xl mb-8">Sessions starting from April 1</p>
          <div className="flex justify-center mb-8">
            <div className="bg-white p-6 rounded-lg flex flex-col items-center">
              <div className="text-black font-bold mb-4 text-center">SCAN FOR WHATSAPP CHANNEL</div>
              <div className="h-48 w-48 bg-gray-200 flex items-center justify-center">
                {/* This is where you'll place your QR code image */}
                <p className="text-gray-500 text-sm">Place QR code at: /public/images/whatsapp-qr.png</p>
              </div>
            </div>
          </div>
          <p className="text-lg">Join our community and take charge of your health today!</p>
          <div className="mt-8">
            <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              <Link href="/user/register">Register Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">PHYSICAL AND MENTAL WELLNESS</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <WellnessCard
              title="DIET PLANS"
              content="Our customized diet plans are designed to complement your yoga practice. We focus on balanced nutrition that fuels your body, supports your goals, and promotes overall health. Our experts will guide you through sustainable eating habits that work for your lifestyle."
            />
            <WellnessCard
              title="FAT LOSS"
              content="Our comprehensive approach to fat loss combines targeted yoga poses, light muscle training, and nutritional guidance. We focus on sustainable methods that help you lose weight gradually while building strength and improving flexibility, ensuring long-term results."
            />
            <WellnessCard
              title="TRAINING"
              content="Our training programs are designed for all fitness levels. We incorporate traditional yoga practices with modern exercise techniques to create a holistic approach to fitness. Our experienced instructors provide personalized guidance to help you achieve your wellness goals safely and effectively."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">STHAVISHTAH YOGA</h3>
              <p className="mb-4">
                Transforming lives through authentic yoga practices and holistic wellness approaches.
              </p>
              <p>© {new Date().getFullYear()} STHAVISHTAH YOGA. All rights reserved.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contact Us</h3>
              <p className="mb-2">Email: sthavishtah2024@gmail.com</p>
              <div className="flex items-center mb-2">
                <Instagram className="h-4 w-4 mr-2" />
                <span>@sthavishtah</span>
              </div>
              <p>Address: Bengaluru, India</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/user/login" className="hover:underline">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/user/register" className="hover:underline">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="/admin/login" className="hover:underline">
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

function BatchTime({ number, time }: { number: string; time: string }) {
  return (
    <div className="flex items-center p-3 border rounded-md bg-gray-50">
      <Badge variant="outline" className="mr-3 px-3 py-1 font-bold">
        BATCH {number}
      </Badge>
      <span className="font-medium">{time}</span>
    </div>
  )
}

function OfferingCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-purple-100 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">{icon}</div>
          <h3 className="text-xl font-semibold mb-3">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function WellnessCard({ title, content }: { title: string; content: string }) {
  return (
    <Card className="border-purple-100 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <h3 className="text-xl font-bold mb-4 text-purple-700">{title}</h3>
          <p className="text-gray-700">{content}</p>
        </div>
      </CardContent>
    </Card>
  )
}
