'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { useMockAuth } from "@/hooks/useMockAuth";
// @ts-ignore
import { api } from "@/convex/_generated/api";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/report', label: 'Report Incident' },
  { href: '/map', label: 'Live Map' },
  { href: '/community-risk', label: 'Community Risk (CRI)' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/about', label: 'About' },
]

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { isAuthenticated, signOut, user } = useMockAuth()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="fixed inset-x-0 top-0 z-[9999] px-3 pt-3 sm:px-5 sm:pt-4">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-xl border border-border/70 bg-card/70 px-4 py-2.5 backdrop-blur-xl sm:px-5">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/ghana-coat-of-arms-new.png"
            alt="Government of Ghana coat of arms"
            width={40}
            height={40}
            className="h-9 w-9 object-contain"
            priority
          />
          <span className="flex flex-col leading-none">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              CrisisEye
            </span>
            <span className="hidden text-[11px] leading-tight text-muted-foreground sm:block">
              Ghana&apos;s Emergency
              <br />
              Coordination Platform
            </span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  'relative rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(link.href)
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {isAuthenticated ? (
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-sm font-medium text-foreground">
                {user ? user.name || user.email : "Loading..."}
              </span>
              <Button
                onClick={() => signOut()}
                variant="outline"
                className="h-9 rounded-full border-border/70 bg-transparent px-4 text-xs"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'hidden h-9 gap-1.5 rounded-full border-border/70 bg-transparent px-4 sm:inline-flex',
              )}
            >
              <UserRound className="size-4" />
              Login / Sign Up
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-9 items-center justify-center rounded-md text-foreground lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="mx-auto mt-2 max-w-7xl rounded-xl border border-border/70 bg-card/95 p-2 backdrop-blur-xl lg:hidden">
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive(link.href)
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-border/60 pt-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground"
              >
                <UserRound className="size-4" />
                Login / Sign Up
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
