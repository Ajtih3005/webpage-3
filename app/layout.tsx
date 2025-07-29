import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sthavishtah Yoga and Wellness",
  description: "Yoga and wellness platform for holistic health",
  generator: "v0.dev",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico",
  },
  // Add Open Graph meta tags for social sharing
  openGraph: {
    title: "Sthavishtah Yoga and Wellness",
    description:
      "Transform your life through authentic yoga practices and natural wellness approaches. Join our serene community for mind, body, and spirit harmony.",
    url: "https://sthavishtah-yoga.vercel.app",
    siteName: "Sthavishtah Yoga",
    images: [
      {
        url: "/images/logo.png", // Using your existing logo
        width: 1200,
        height: 630,
        alt: "Sthavishtah Yoga and Wellness Logo",
      },
      {
        url: "/images/serene-forest-meditation.jpg", // Alternative hero image
        width: 1200,
        height: 630,
        alt: "Serene Forest Meditation - Sthavishtah Yoga",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  // Add Twitter Card meta tags
  twitter: {
    card: "summary_large_image",
    title: "Sthavishtah Yoga and Wellness",
    description: "Transform your life through authentic yoga practices and natural wellness approaches.",
    images: ["/images/logo.png"],
    creator: "@sthavishtah",
  },
  // Additional meta tags
  keywords: [
    "yoga",
    "wellness",
    "meditation",
    "holistic health",
    "mindfulness",
    "spiritual growth",
    "natural healing",
    "yoga classes",
    "online yoga",
    "sthavishtah",
  ],
  authors: [{ name: "Sthavishtah Yoga Team" }],
  creator: "Sthavishtah Yoga",
  publisher: "Sthavishtah Yoga",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Traditional favicon for maximum compatibility */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>

        {/* Additional meta tags for better SEO */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#16a34a" />
        <link rel="canonical" href="https://sthavishtah-yoga.vercel.app" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
