"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

type AuthFlow = "login" | "register" | "responder-login" | "admin-login";

interface AuthFormProps {
  flow: AuthFlow;
  title: string;
  subtitle: string;
  redirectUrl: string;
}

export function AuthForm({ flow, title, subtitle, redirectUrl }: AuthFormProps) {
  const isRegister = flow === "register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signOut } = useAuthActions();
  const router = useRouter();
  const convex = useConvex();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const role = flow === "responder-login" ? "responder" : flow === "admin-login" ? "admin" : "citizen";

    try {
      if (isRegister) {
        await signIn("password", { name, email, password, flow: "signUp", role });
        router.push(redirectUrl);
      } else {
        await signIn("password", { email, password, flow: "signIn" });
        const user = await convex.query(api.users.current);
        if (user) {
          const userRole = user.role || "citizen";
          const isAuthorized = 
            (flow === "responder-login" && userRole !== "citizen") ||
            (flow === "admin-login" && userRole === "admin") ||
            (flow === "login" && userRole === "citizen");
            
          if (!isAuthorized) {
            // Sign out the unauthorized user
            await signOut();
            throw new Error(`Account not authorized for ${flow.replace("-", " ")}`);
          }
        }
        router.push(redirectUrl);
      }
    } catch (error) {
      console.error("Auth error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      alert(`Authentication failed: ${errorMessage}`);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Optional ambient background effect */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md space-y-8 rounded-2xl border border-border/50 bg-card/60 p-8 shadow-2xl backdrop-blur-xl relative z-10"
      >
        <div className="text-center">
          <Image
            src="/ghana-coat-of-arms-new.png"
            alt="Ghana Coat of Arms"
            width={64}
            height={64}
            className="mx-auto h-16 w-16 object-contain"
          />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            {isRegister && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
              >
                <label className="sr-only" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="relative block w-full rounded-md border border-border/60 bg-background/50 px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                  placeholder="Full Name"
                />
              </motion.div>
            )}
            <div>
              <label className="sr-only" htmlFor="email-address">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-md border border-border/60 bg-background/50 px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                placeholder="Email address"
              />
            </div>
            <div className="relative">
              <label className="sr-only" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-md border border-border/60 bg-background/50 px-3 py-2 pr-10 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!isRegister && (
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:text-primary/80 transition-colors">
                  Forgot your password?
                </a>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRegister ? "Register" : "Sign in"}
            </button>
          </div>
        </form>

        {flow !== "responder-login" && (
          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {isRegister ? "Already have an account?" : "Don't have an account?"}
            </span>{" "}
            <button
              onClick={() => router.push(isRegister ? "/login" : "/register")}
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {isRegister ? "Sign in" : "Register"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
