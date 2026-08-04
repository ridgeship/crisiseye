"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode, useState } from "react";
import { Loader2 } from "lucide-react";
import { readPresentationSession } from "@/lib/presentation-session";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  fallbackUrl?: string;
}

export function ProtectedRoute({ children, allowedRoles, fallbackUrl = "/login" }: ProtectedRouteProps) {
  const auth = useConvexAuth() || { isAuthenticated: false, isLoading: true };
  const { isAuthenticated, isLoading: authLoading } = auth;
  const [presentationRole, setPresentationRole] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const user = useQuery(api.users.current, {});
  const router = useRouter();
  const hasPresentationSession = Boolean(presentationRole);
  const effectiveRole = user?.role || presentationRole || "citizen";

  useEffect(() => {
    const session = readPresentationSession();
    setPresentationRole(session?.role || null);
    setSessionChecked(true);
  }, []);

  useEffect(() => {
    if (!sessionChecked) return;
    if (!authLoading && !isAuthenticated && !hasPresentationSession) {
      router.replace(fallbackUrl);
      return;
    }

    if ((!authLoading || hasPresentationSession) && (isAuthenticated || hasPresentationSession) && allowedRoles) {
      if (!allowedRoles.includes(effectiveRole)) {
        if (effectiveRole !== "citizen") router.replace("/responder");
        else router.replace("/dashboard");
      }
    }
  }, [sessionChecked, authLoading, isAuthenticated, hasPresentationSession, router, allowedRoles, fallbackUrl, effectiveRole]);

  if (!sessionChecked || (authLoading && !hasPresentationSession) || (isAuthenticated && !hasPresentationSession && user === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if ((!isAuthenticated && !hasPresentationSession) || (allowedRoles && !allowedRoles.includes(effectiveRole))) {
    return null;
  }

  return <>{children}</>;
}
