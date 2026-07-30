"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  fallbackUrl?: string;
}

export function ProtectedRoute({ children, allowedRoles, fallbackUrl = "/login" }: ProtectedRouteProps) {
  const auth = useConvexAuth() || { isAuthenticated: false, isLoading: true };
  const { isAuthenticated, isLoading: authLoading } = auth;
  const user = useQuery(api.users.current, {});
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(fallbackUrl);
    } else if (!authLoading && isAuthenticated && user !== undefined) {
      if (allowedRoles) {
        if (!user || !allowedRoles.includes(user.role || "citizen")) {
          // Redirect to their default dashboard if they don't have access
          if (user?.role === "responder") router.replace("/responder");
          else if (user?.role === "citizen") router.replace("/dashboard");
          else router.replace("/");
        }
      }
    }
  }, [authLoading, isAuthenticated, user, router, allowedRoles, fallbackUrl]);

  if (authLoading || (isAuthenticated && user === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || (allowedRoles && (!user || !allowedRoles.includes(user.role || "citizen")))) {
    return null;
  }

  return <>{children}</>;
}

