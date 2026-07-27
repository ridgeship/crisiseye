"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Menu, X, UserRound, ShieldCheck, Flame, Ambulance, Shield, Zap, UserCog, ChevronDown, LogOut, Settings, FileText, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/report", label: "Report Incident" },
  { href: "/map", label: "Live Map" },
  { href: "/community-risk", label: "Community Risk (CRI)" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.users.current);
  const { signOut } = useAuthActions();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const isResponder = user && user.role !== "citizen";

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  const getRoleDisplay = () => {
    if (isLoading || (isAuthenticated && user === undefined)) {
      return { label: "Loading...", icon: UserRound, color: "text-slate-400", bg: "bg-slate-800" };
    }
    if (!isAuthenticated) return null;
    
    if (!user) {
      return { label: "Account", icon: UserRound, color: "text-slate-400", bg: "bg-slate-800" };
    }
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
    <>
      <header className="fixed inset-x-0 top-0 z-[50] px-3 pt-3 sm:px-5 sm:pt-4">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-xl border border-border/70 bg-card/70 px-4 py-2.5 backdrop-blur-xl sm:px-5">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
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
                      "relative rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                      isActive(link.href) ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                    {isActive(link.href) && (
                      <motion.span 
                        layoutId="nav-indicator"
                        className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary" 
                      />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {isResponder && (
            <ul className="hidden items-center gap-1 lg:flex">
              <li>
                <Link href="/responder" className="relative rounded-md px-3 py-2 text-sm font-medium transition-colors text-foreground">
                  Operational Dashboard
                  <motion.span layoutId="nav-indicator" className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary" />
                </Link>
              </li>
            </ul>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {isAuthenticated ? (
              roleDisplay && (
                <div className="relative flex items-center gap-2 sm:gap-3" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={cn(
                      "flex items-center gap-1.5 sm:gap-2 rounded-full border border-border/70 pr-2 sm:pr-3 pl-1 sm:pl-1.5 py-1 sm:py-1.5 transition-colors hover:bg-secondary/50",
                      dropdownOpen && "bg-secondary/50"
                    )}
                  >
                    <div className={cn("flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-full", roleDisplay.bg, roleDisplay.color)}>
                      <roleDisplay.icon className="size-3.5 sm:size-4" />
                    </div>
                    <span className="max-w-[100px] truncate text-xs sm:text-sm font-medium text-foreground sm:max-w-[150px]">
                      {roleDisplay.label}
                    </span>
                    <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", dropdownOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-48 rounded-md border border-border/70 bg-card p-1 shadow-lg"
                      >
                        {!isResponder && (
                          <>
                            <Link href="/profile" className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-secondary transition-colors" onClick={() => setDropdownOpen(false)}>
                              <UserRound className="size-4 text-muted-foreground" /> My Profile
                            </Link>
                            <Link href="/dashboard" className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-secondary transition-colors" onClick={() => setDropdownOpen(false)}>
                              <FileText className="size-4 text-muted-foreground" /> My Reports
                            </Link>
                            <Link href="/community-risk" className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-secondary transition-colors" onClick={() => setDropdownOpen(false)}>
                              <Activity className="size-4 text-muted-foreground" /> CRI
                            </Link>
                            <Link href="/settings" className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-secondary transition-colors" onClick={() => setDropdownOpen(false)}>
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
                          className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="size-4" /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            ) : (
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "hidden h-9 gap-1.5 rounded-full border-border/70 bg-transparent px-4 transition-all hover:bg-secondary sm:inline-flex",
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
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-md lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
              className="fixed inset-x-4 top-[72px] z-50 rounded-xl border border-border/70 bg-card shadow-2xl lg:hidden"
            >
              <ul className="flex flex-col p-2">
                {!isResponder && NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block rounded-md px-3 py-3 text-sm font-medium transition-colors",
                        isActive(link.href)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                
                {isAuthenticated ? (
                  <li className="mt-2 border-t border-border/60 pt-2">
                    <button
                      onClick={() => {
                        setOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="size-4" /> Logout
                    </button>
                  </li>
                ) : (
                  <li className="mt-2 border-t border-border/60 pt-2">
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <UserRound className="size-4" />
                      Login / Sign Up
                    </Link>
                  </li>
                )}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
