import { LoginButton } from "@/components/login-button"

export default function SiteHeader() {
  return (
    <header className="bg-gray-100 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <a href="/" className="text-2xl font-bold">
          My App
        </a>
        <nav>
          <ul className="flex items-center space-x-4">
            <li>
              <a href="/about">About</a>
            </li>
            <li>
              <a href="/contact">Contact</a>
            </li>
            <li>
              <LoginButton className="ml-4" />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
