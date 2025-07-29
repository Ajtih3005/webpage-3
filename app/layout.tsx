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
  metadataBase: new URL("https://sthavishtah.com"),
  openGraph: {
    title: "Sthavishtah Yoga and Wellness",
    description: "Yoga and wellness platform for holistic health",
    url: "https://sthavishtah.com",
    siteName: "Sthavishtah Yoga",
    images: [
      {
        url: "/images/logo.png",
        width: 1200,
        height: 630,
        alt: "Sthavishtah Yoga and Wellness Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sthavishtah Yoga and Wellness",
    description: "Yoga and wellness platform for holistic health",
    images: ["/images/logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
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
