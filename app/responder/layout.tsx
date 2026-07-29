"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Map as MapIcon,
  BarChart3,
  LogOut,
  ShieldAlert,
  Radio,
  Send,
  Users,
  History,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AGENCIES } from "@/lib/data";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { href: "/responder", label: "Dashboard", icon: LayoutDashboard },
  { href: "/responder/incidents", label: "Incident Queue", icon: AlertTriangle },
  { href: "/responder/map", label: "Operations Map", icon: MapIcon },
  { href: "/responder/map?mode=public", label: "Public Map Preview", icon: MapIcon },
  { href: "/responder/dispatch", label: "Dispatch", icon: Send },
  { href: "/responder/units", label: "Units", icon: Users },
  { href: "/responder/communications", label: "Communications", icon: Radio },
  { href: "/responder/history", label: "Incident History", icon: History },
  { href: "/responder/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/responder/settings", label: "Settings", icon: Settings },
];

export default function ResponderLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.current);
  const router = useRouter();
  const pathname = usePathname();
  const [time, setTime] = useState<Date | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/responder-login");
  };

  const agency = AGENCIES.find((a) => a.id === user?.role) || {
    name: "National Emergency Operations Centre",
    short: "NEOC",
    logo: "/ghana-coat-of-arms-new.png",
    accent: "#ffffff",
  };

  const allowedRoles = ["admin", ...AGENCIES.map(a => a.id)];

  const dateString = time ? time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "";

  return (
    <ProtectedRoute allowedRoles={allowedRoles} fallbackUrl="/responder-login">
      <div className="flex h-screen w-full overflow-hidden bg-[#070b14] text-slate-200">
        
        {/* Sidebar for Desktop */}
        <aside 
          className={cn(
            "hidden flex-col border-r border-slate-800 bg-[#0b0f19] transition-all duration-300 md:flex z-30 shrink-0",
            isSidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-4">
            <div className={cn("flex items-center gap-2.5 overflow-hidden", isSidebarCollapsed && "justify-center w-full")}>
              <ShieldAlert className="size-5 text-red-500 shrink-0" />
              {!isSidebarCollapsed && (
                <span className="font-bold tracking-tight text-white whitespace-nowrap">CrisisEye EOC</span>
              )}
            </div>
            {!isSidebarCollapsed && (
              <button 
                onClick={() => setIsSidebarCollapsed(true)}
                className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
            {isSidebarCollapsed && (
              <button 
                onClick={() => setIsSidebarCollapsed(false)}
                className="absolute left-14 top-4 rounded bg-slate-900 border border-slate-800 p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="size-4" />
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-0.5 px-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-slate-800/80 text-white border-l-2 border-primary" 
                        : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-slate-500")} />
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-slate-800 p-3">
            <button
              onClick={handleSignOut}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-white",
                isSidebarCollapsed && "justify-center"
              )}
            >
              <LogOut className="size-4 shrink-0 text-slate-500" />
              {!isSidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar overlay */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
        
        {/* Mobile Sidebar Drawer */}
        <aside 
          className={cn(
            "fixed bottom-0 top-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-[#0b0f19] transition-transform duration-300 md:hidden",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-4">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="size-5 text-red-500" />
              <span className="font-bold tracking-tight text-white">CrisisEye EOC</span>
            </div>
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="rounded p-1 text-slate-400 hover:bg-slate-800"
            >
              <ChevronLeft className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-4 px-2">
            <nav className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-slate-800 text-white" 
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                    )}
                  >
                    <Icon className="size-4 text-slate-500" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="border-t border-slate-800 p-4">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-white"
            >
              <LogOut className="size-4 text-slate-500" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          
          {/* Topbar / Command Bar */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-[#0b0f19] px-4 md:px-6 shadow-sm z-20">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileOpen(true)}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-800 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="rounded bg-white/5 p-1 border border-white/10 hidden sm:block">
                  <Image
                    src="/ghana-coat-of-arms-new.png"
                    alt="Ghana"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div className="h-6 w-px bg-slate-800 hidden sm:block" />
                <div className="flex flex-col">
                  <h1 className="text-sm md:text-base font-bold tracking-tight text-white leading-tight">
                    {agency.name}
                  </h1>
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
                    {agency.short} Operations Command
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 md:gap-6 text-sm">
              {/* Notifications indicator (Architecture ready) */}
              <button 
                className="relative rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="View notifications"
              >
                <Bell className="size-4" />
                <span className="absolute right-1 top-1 flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-red-500"></span>
                </span>
              </button>

              {/* Time display */}
              <div className="hidden flex-col text-right font-mono text-xs md:flex">
                <span className="text-slate-300 font-semibold">
                  {time ? time.toLocaleTimeString('en-US', { hour12: false }) : "--:--:--"}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">{dateString}</span>
              </div>

              {/* User profile dropdown menu */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none cursor-pointer">
                  <div className="flex size-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700 hover:border-slate-500 transition-colors">
                    {user?.name?.[0]?.toUpperCase() || "O"}
                  </div>
                  <span className="hidden font-medium text-slate-300 sm:block max-w-[120px] truncate text-xs">
                    {user?.name || "Operator"}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0d1424] border border-slate-800 text-slate-200">
                  <DropdownMenuLabel className="text-slate-400 text-xs">My Account</DropdownMenuLabel>
                  <DropdownMenuItem className="text-xs focus:bg-slate-800 text-slate-200">
                    Role: <span className="ml-1 font-bold text-primary uppercase">{user?.role || "Responder"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs focus:bg-slate-800 text-slate-200">
                    Email: {user?.email || "N/A"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="text-xs text-red-400 focus:bg-red-950/20 focus:text-red-300 cursor-pointer"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-[#070b14] p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
