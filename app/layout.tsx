import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://sthavishtah.com"),
  title: "Sthavishtah Yoga and Wellness",
  description: "Yoga and wellness platform for holistic health",
  openGraph: {
    title: "Sthavishtah Yoga and Wellness",
    description: "Yoga and wellness platform for holistic health",
    url: "https://sthavishtah.com",
    siteName: "Sthavishtah Yoga and Wellness",
    images: [
      {
        url: "https://sthavishtah.com/images/logo.png",
        width: 1200,
        height: 630,
        alt: "Sthavishtah Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sthavishtah Yoga and Wellness",
    description: "Yoga and wellness platform for holistic health",
    images: ["https://sthavishtah.com/images/logo.png"],
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta property="fb:app_id" content="924180826548374" />
        <meta property="og:title" content="Sthavishtah Yoga and Wellness" />
        <meta property="og:description" content="Yoga and wellness platform for holistic health" />
        <meta property="og:image" content="https://sthavishtah.com/images/logo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Sthavishtah Logo" />
        <meta property="og:url" content="https://sthavishtah.com" />
        <meta property="og:type" content="website" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
