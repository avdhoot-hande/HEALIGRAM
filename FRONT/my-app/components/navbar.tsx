"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navbar() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <span className="text-2xl">❤️</span>
            <span>Healigram</span>
          </Link>

          <div className="hidden md:flex gap-8">
            <Link
              href="/"
              className={`transition-colors ${
                isActive("/") ? "text-primary font-semibold" : "text-foreground hover:text-primary"
              }`}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`transition-colors ${
                isActive("/about") ? "text-primary font-semibold" : "text-foreground hover:text-primary"
              }`}
            >
              About
            </Link>
            <Link
              href="/predict"
              className={`transition-colors ${
                isActive("/predict") ? "text-primary font-semibold" : "text-foreground hover:text-primary"
              }`}
            >
              Predict
            </Link>
          </div>

          <div className="md:hidden">
            <div className="flex gap-4">
              <Link href="/" className="text-sm text-foreground hover:text-primary">
                Home
              </Link>
              <Link href="/about" className="text-sm text-foreground hover:text-primary">
                About
              </Link>
              <Link href="/predict" className="text-sm text-foreground hover:text-primary">
                Predict
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
