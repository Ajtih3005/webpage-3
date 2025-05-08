"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode.react"

interface WhatsAppQRProps {
  phoneNumber?: string
  groupInviteLink?: string
  size?: number
  className?: string
}

export default function WhatsAppQR({ phoneNumber, groupInviteLink, size = 160, className = "" }: WhatsAppQRProps) {
  const [qrValue, setQrValue] = useState("")

  useEffect(() => {
    if (phoneNumber) {
      // Format for direct WhatsApp chat
      setQrValue(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}`)
    } else if (groupInviteLink) {
      // Use group invite link directly
      setQrValue(groupInviteLink)
    } else {
      // Default to the Sthavishtah channel
      setQrValue("https://whatsapp.com/channel/sthavishtah")
    }
  }, [phoneNumber, groupInviteLink])

  if (!qrValue) return null

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md ${className}`}>
      <QRCode
        value={qrValue}
        size={size}
        level="H"
        includeMargin={true}
        renderAs="svg"
        imageSettings={{
          src: "/images/logo.png",
          height: size * 0.2,
          width: size * 0.2,
          excavate: true,
        }}
      />
    </div>
  )
}
