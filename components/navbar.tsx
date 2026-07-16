'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Menu, X, UserRound, ShieldCheck, Flame, Ambulance, Shield, Zap, UserCog, ChevronDown, LogOut, Settings, FileText, Activity } from 'lucide-react'
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
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated, signOut, user } = useMockAuth()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const isResponder = user && user.role !== "citizen";

  const getRoleDisplay = () => {
    if (!user) return null;
    switch (user.role) {
      case "police": return { label: "Police Officer", icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "fire": return { label: "Fire Service", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" };
      case "ambulance": return { label: "Ambulance", icon: Ambulance, color: "text-emerald-500", bg: "bg-emerald-500/10" };
      case "nadmo": return { label: "NADMO", icon: Shield, color: "text-amber-500", bg: "bg-amber-500/10" };
      case "ecg": return { label: "ECG", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" };
      case "admin": return { label: "Administrator", icon: UserCog, color: "text-purple-500", bg: "bg-purple-500/10" };
      default: return { label: user.name || "Citizen", icon: UserRound, color: "text-slate-400", bg: "bg-slate-800" };
    }
  };

  const roleDisplay = getRoleDisplay();

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
        {!isResponder && (
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
        )}

        {isResponder && (
          <ul className="hidden items-center gap-1 lg:flex">
            <li>
              <Link href="/responder" className={cn('relative rounded-md px-3 py-2 text-sm font-medium transition-colors text-foreground')}>
                Operational Dashboard
                <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary" />
              </Link>
            </li>
          </ul>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {isAuthenticated && roleDisplay ? (
            <div className="relative hidden items-center gap-3 sm:flex" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={cn(
                  "flex items-center gap-2 rounded-full border border-border/70 pr-3 pl-1.5 py-1.5 transition-colors hover:bg-secondary/50",
                  dropdownOpen && "bg-secondary/50"
                )}
              >
                <div className={cn("flex size-7 items-center justify-center rounded-full", roleDisplay.bg, roleDisplay.color)}>
                  <roleDisplay.icon className="size-4" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {roleDisplay.label}
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-md border border-border/70 bg-card p-1 shadow-md">
                  {!isResponder && (
                    <>
                      <Link href="/profile" className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-secondary">
                        <UserRound className="size-4 text-muted-foreground" /> My Profile
                      </Link>
                      <Link href="/dashboard" className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-secondary">
                        <FileText className="size-4 text-muted-foreground" /> My Reports
                      </Link>
                      <Link href="/community-risk" className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-secondary">
                        <Activity className="size-4 text-muted-foreground" /> CRI
                      </Link>
                      <Link href="/settings" className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-secondary">
                        <Settings className="size-4 text-muted-foreground" /> Settings
                      </Link>
                      <div className="my-1 h-px bg-border/60" />
                    </>
                  )}
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
                  >
                    <LogOut className="size-4" /> Logout
                  </button>
                </div>
              )}
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
            {!isResponder && NAV_LINKS.map((link) => (
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
            
            {isAuthenticated ? (
              <li className="mt-1 border-t border-border/60 pt-2">
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10"
                >
                  <LogOut className="size-4" /> Logout
                </button>
              </li>
            ) : (
              <li className="mt-1 border-t border-border/60 pt-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  <UserRound className="size-4" />
                  Login / Sign Up
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  )
}
