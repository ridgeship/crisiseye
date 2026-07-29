"use client";
import React from "react";
import Link from "next/link";
import { useConvexAuth } from "convex/react";

export default function NotFoundClient() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) return <div className="flex min-h-screen items-center justify-center">Loading…</div>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">404</h1>
      <p className="mt-4 text-base text-muted-foreground">
        We couldn't find the page you're looking for.
      </p>
      <div className="mt-6 flex items-center justify-center gap-4">
        <Link 
          href="/" 
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
