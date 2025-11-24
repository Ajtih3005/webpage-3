import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { meetingNumber } = await request.json()

    // Get Zoom credentials from environment variables
    const apiKey = process.env.ZOOM_API_KEY
    const apiSecret = process.env.ZOOM_API_SECRET

    if (!apiKey || !apiSecret) {
      console.error("[v0] Zoom credentials not configured")
      return NextResponse.json(
        {
          error:
            "Zoom integration not configured. Please add ZOOM_API_KEY and ZOOM_API_SECRET to environment variables.",
        },
        { status: 500 },
      )
    }

    // Generate Zoom JWT signature
    const timestamp = new Date().getTime() - 30000
    const msg = Buffer.from(apiKey + meetingNumber + timestamp + 0).toString("base64")
    const hash = crypto.createHmac("sha256", apiSecret).update(msg).digest("base64")
    const signature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.0.${hash}`).toString("base64")

    console.log("[v0] Generated Zoom signature for meeting:", meetingNumber)

    return NextResponse.json({ signature })
  } catch (error: any) {
    console.error("[v0] Error generating Zoom signature:", error)
    return NextResponse.json({ error: "Failed to generate meeting signature" }, { status: 500 })
  }
}
