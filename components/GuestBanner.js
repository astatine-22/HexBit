"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function GuestBanner({ className = "" }) {
  const { user, loading } = useAuth();

  if (loading || !user?.isGuest) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-accent px-4 py-1.5 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-ink ${className}`}
      role="status"
    >
      <span>Signed in as Guest — create an account to save your progress</span>
      <Link
        href="/login?mode=signup&migrate=1"
        className="rounded-full bg-ink px-2.5 py-1 text-[8px] font-semibold tracking-[0.16em] text-accent transition-opacity hover:opacity-85"
      >
        Sign up
      </Link>
    </div>
  );
}
