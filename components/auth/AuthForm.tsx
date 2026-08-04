"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

type AuthFlow = "login" | "register" | "responder-login" | "admin-login";

const DEMO_ACCOUNTS: Record<string, { email: string; name: string; role: string; password: string }> = {
  police: { email: "police@crisiseye.gov", name: "Police Service", role: "police", password: "POLICE123" },
  fire: { email: "fire@crisiseye.gov", name: "Fire Service", role: "fire", password: "FIRE123" },
  ambulance: { email: "ambulance@crisiseye.gov", name: "Ambulance Service", role: "ambulance", password: "AMBULANCE123" },
  nadmo: { email: "nadmo@crisiseye.gov", name: "NADMO", role: "nadmo", password: "NADMO123" },
  ecg: { email: "ecg@crisiseye.gov", name: "ECG", role: "ecg", password: "ECG123" },
  gwc: { email: "gwa@crisiseye.gov", name: "Ghana Water", role: "gwa", password: "GWA123" },
  gwa: { email: "gwa@crisiseye.gov", name: "Ghana Water", role: "gwa", password: "GWA123" },
  admin: { email: "admin@crisiseye.gov", name: "Admin Operations", role: "admin", password: "ADMIN123" },
};

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
  const { signIn } = useAuthActions();
  const router = useRouter();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let finalEmail = email;
    let finalRole = flow === "responder-login" ? "responder" : flow === "admin-login" ? "admin" : "citizen";
    let finalName = name;

    const normalizedLoginId = email.trim().toLowerCase();

    if (flow === "responder-login" || flow === "admin-login") {
      const id = email.trim().toLowerCase();

      if (DEMO_ACCOUNTS[id]) {
        finalEmail = DEMO_ACCOUNTS[id].email;
        finalRole = DEMO_ACCOUNTS[id].role;
        finalName = DEMO_ACCOUNTS[id].name;
      } else if (!email.includes("@")) {
        // Fallback for custom responder IDs
        finalEmail = `${id}@crisiseye.gov`;
        finalRole = "responder";
        finalName = email;
      }
    } else if (flow === "login" && email.includes("@")) {
      // If logging in as citizen but typing a responder email, handle it gracefully
      const prefix = email.split("@")[0].toLowerCase();
      const validRoles = Object.keys(DEMO_ACCOUNTS);
      if (validRoles.includes(prefix) && email.endsWith("@crisiseye.gov")) {
        finalRole = DEMO_ACCOUNTS[prefix].role;
      }
    }

    try {
      const demoAccount =
        DEMO_ACCOUNTS[normalizedLoginId] ||
        (finalEmail.endsWith("@crisiseye.gov") ? DEMO_ACCOUNTS[finalEmail.split("@")[0].toLowerCase()] : undefined);

      const authPassword = demoAccount?.password || `crisiseye-demo-${finalEmail.trim().toLowerCase()}`;

      if (isRegister) {
        await signIn("password", { name: finalName, email: finalEmail, password: authPassword, flow: "signUp", role: finalRole });
        router.push(redirectUrl);
      } else {
        try {
          await signIn("password", { email: finalEmail, password: authPassword, flow: "signIn" });
        } catch (err) {
          // If sign-in fails and it's a responder login, attempt auto-registration on first use
          if (flow === "responder-login" || flow === "admin-login" || finalEmail.endsWith("@crisiseye.gov")) {
            console.log("Agency account not found, auto-registering...");
            await signIn("password", {
              name: finalName,
              email: finalEmail,
              password: authPassword,
              flow: "signUp",
              role: finalRole,
            });
          } else {
            await signIn("password", {
              name: finalName || finalEmail.split("@")[0],
              email: finalEmail,
              password: authPassword,
              flow: "signUp",
              role: "citizen",
            });
          }
        }
        // signIn resolves once the session token is set — redirect immediately.
        // Role-based access is enforced at the destination page via ProtectedRoute / server checks.
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
              <label className="sr-only" htmlFor={flow === "responder-login" ? "responder-id" : "email-address"}>
                {flow === "responder-login" ? "Responder ID" : "Email address"}
              </label>
              <input
                id={flow === "responder-login" ? "responder-id" : "email-address"}
                name="email"
                type={flow === "responder-login" ? "text" : "email"}
                autoComplete={flow === "responder-login" ? "username" : "email"}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-md border border-border/60 bg-background/50 px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                placeholder={flow === "responder-login" ? "Responder ID (e.g. Police, ECG, Fire)" : "Email address"}
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
