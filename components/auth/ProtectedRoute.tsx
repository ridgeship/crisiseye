"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode, useState } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  fallbackUrl?: string;
}

export function ProtectedRoute({ children, allowedRoles, fallbackUrl = "/login" }: ProtectedRouteProps) {
  const auth = useConvexAuth() || { isAuthenticated: false, isLoading: true };
  const { isAuthenticated, isLoading: authLoading } = auth;
  const [presentationUserId, setPresentationUserId] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const user = useQuery(api.users.current, presentationUserId ? { mockUserId: presentationUserId as any } : {});
  const router = useRouter();
  const hasPresentationSession = Boolean(presentationUserId);

  useEffect(() => {
    setPresentationUserId(localStorage.getItem("crisiseye_user_id"));
    setSessionChecked(true);
  }, []);

  useEffect(() => {
    if (!sessionChecked) return;
    if (!authLoading && !isAuthenticated && !hasPresentationSession) {
      router.replace(fallbackUrl);
    } else if ((!authLoading || hasPresentationSession) && (isAuthenticated || hasPresentationSession) && user !== undefined) {
      if (allowedRoles) {
        if (!user || !allowedRoles.includes(user.role || "citizen")) {
          // Redirect to their default dashboard if they don't have access
          if (user?.role && user.role !== "citizen") router.replace("/responder");
          else if (user?.role === "citizen") router.replace("/dashboard");
          else router.replace("/");
        }
      }
    }
  }, [sessionChecked, authLoading, isAuthenticated, hasPresentationSession, user, router, allowedRoles, fallbackUrl]);

  if (!sessionChecked || authLoading || ((isAuthenticated || hasPresentationSession) && user === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if ((!isAuthenticated && !hasPresentationSession) || (allowedRoles && (!user || !allowedRoles.includes(user.role || "citizen")))) {
    return null;
  }

  return <>{children}</>;
}

