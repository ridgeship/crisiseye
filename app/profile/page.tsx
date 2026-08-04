"use client";

import { useMemo, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { readPresentationSession } from "@/lib/presentation-session";
import { UserRound, Mail, Shield, Phone } from "lucide-react";

export default function ProfilePage() {
  const user = useQuery(api.users.current, {});
  const presentationUser = useMemo(() => {
    if (typeof window === "undefined") return null;
    return readPresentationSession();
  }, []);

  const profile = user || presentationUser;

  return (
    <ProtectedRoute fallbackUrl="/login">
      <main className="mx-auto max-w-3xl px-4 pb-10 pt-28">
        <section className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account details used for reporting and safety notifications.
          </p>

          <div className="mt-6 grid gap-3">
            <ProfileRow icon={<UserRound className="size-4 text-primary" />} label="Name" value={profile?.name || "Not set"} />
            <ProfileRow icon={<Mail className="size-4 text-primary" />} label="Email" value={profile?.email || "Not set"} />
            <ProfileRow icon={<Shield className="size-4 text-primary" />} label="Role" value={profile?.role || "citizen"} />
            <ProfileRow icon={<Phone className="size-4 text-primary" />} label="Phone" value={(user as any)?.phone || "Not set"} />
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}

function ProfileRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="max-w-[60%] truncate text-sm text-foreground">{value}</span>
    </div>
  );
}
