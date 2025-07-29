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
  // Explicitly declare Open Graph meta tags
  openGraph: {
    title: "Sthavishtah Yoga and Wellness",
    description: "Yoga and wellness platform for holistic health",
    url: "https://sthavishtah.com",
    siteName: "Sthavishtah Yoga",
    images: [
      {
        url: "https://sthavishtah.com/images/logo.png",
        width: 1200,
        height: 630,
        alt: "Sthavishtah Yoga and Wellness Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  // Twitter Card meta tags
  twitter: {
    card: "summary_large_image",
    title: "Sthavishtah Yoga and Wellness",
    description: "Yoga and wellness platform for holistic health",
    images: ["https://sthavishtah.com/images/logo.png"],
  },
  // Additional SEO meta tags
  keywords: [
    "yoga",
    "wellness",
    "meditation",
    "holistic health",
    "mindfulness",
    "spiritual growth",
    "yoga classes",
    "online yoga",
    "sthavishtah",
  ],
  authors: [{ name: "Sthavishtah Yoga Team" }],
  creator: "Sthavishtah Yoga",
  publisher: "Sthavishtah Yoga",
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

        {/* Explicitly declare Open Graph meta tags */}
        <meta property="og:title" content="Sthavishtah Yoga and Wellness" />
        <meta property="og:description" content="Yoga and wellness platform for holistic health" />
        <meta property="og:image" content="https://sthavishtah.com/images/logo.png" />
        <meta property="og:image:alt" content="Sthavishtah Yoga and Wellness Logo" />
        <meta property="og:url" content="https://sthavishtah.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Sthavishtah Yoga" />

        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sthavishtah Yoga and Wellness" />
        <meta name="twitter:description" content="Yoga and wellness platform for holistic health" />
        <meta name="twitter:image" content="https://sthavishtah.com/images/logo.png" />

        {/* Additional meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#16a34a" />
        <link rel="canonical" href="https://sthavishtah.com" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
