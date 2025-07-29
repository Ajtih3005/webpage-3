import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get("title") || "Sthavishtah Yoga and Wellness"
    const subtitle = searchParams.get("subtitle") || "Find your inner peace through mindful practice"
    const bg = searchParams.get("bg") || "default"

    // Define background gradients based on page type
    const backgrounds = {
      default: "linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)",
      yoga: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)",
      meditation: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
      wellness: "linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)",
    }

    const backgroundStyle = backgrounds[bg as keyof typeof backgrounds] || backgrounds.default

    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: backgroundStyle,
          fontSize: 32,
          fontWeight: 600,
        }}
      >
        {/* Logo/Icon area */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.2)",
            marginBottom: 40,
            border: "3px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          <div
            style={{
              fontSize: 48,
              color: "white",
            }}
          >
            🧘‍♀️
          </div>
        </div>

        {/* Main title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            color: "white",
            maxWidth: "80%",
          }}
        >
          <h1
            style={{
              fontSize: 64,
              fontWeight: "bold",
              margin: 0,
              marginBottom: 20,
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              lineHeight: 1.1,
            }}
          >
            {title}
          </h1>

          <p
            style={{
              fontSize: 28,
              margin: 0,
              opacity: 0.9,
              textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
              textAlign: "center",
              maxWidth: "90%",
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Brand name at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: 24,
            fontWeight: 500,
          }}
        >
          STHAVISHTAH YOGA & WELLNESS
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
