import type { Metadata } from "next"

interface PageMetadata {
  title: string
  description: string
  image?: string
  url?: string
}

export function generatePageMetadata({
  title,
  description,
  image = "/images/logo.png",
  url = "https://sthavishtah.com",
}: PageMetadata): Metadata {
  const fullTitle = `${title} | Sthavishtah Yoga and Wellness`

  return {
    title: fullTitle,
    description,
    metadataBase: new URL("https://sthavishtah.com"),
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: "Sthavishtah Yoga",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  }
}

export function generateDynamicOGImage(title: string, subtitle?: string, backgroundImage?: string): string {
  const params = new URLSearchParams({
    title: title,
    ...(subtitle && { subtitle }),
    ...(backgroundImage && { bg: backgroundImage }),
  })

  return `/api/og?${params.toString()}`
}
