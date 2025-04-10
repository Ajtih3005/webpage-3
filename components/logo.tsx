import Image from "next/image"
import Link from "next/link"

export function Logo() {
  return (
    <Link href="/" className="flex items-center">
      <div className="bg-white p-1 rounded-md flex items-center">
        <div className="relative h-10 w-10 mr-2">
          <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" priority />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight">STHAVISHTAH</span>
          <span className="text-xs tracking-widest text-muted-foreground">YOGA AND WELLNESS</span>
        </div>
      </div>
    </Link>
  )
}
