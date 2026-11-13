"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { logout } from "@/lib/auth";
import SplitFlapDisplay from "@/components/ui/split-flap-display";

export default function UserMenu({ tone = "dark" }) {
  const { user, loading, logout: authLogout } = useAuth();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function handleLogout() {
    setOpen(false);
    const name = user?.displayName || "friend";
    authLogout();
    setToast(`See you soon, ${name}!`);
    window.setTimeout(() => {
      window.location.href = "/login";
    }, 600);
  }

  if (loading) {
    return (
      <span
        className="h-8 w-8 animate-pulse rounded-full border border-paper/15 bg-paper/5"
        aria-hidden="true"
      />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-paper/20 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-paper/70 transition-colors hover:border-accent/50 hover:text-accent"
      >
        Log in
      </Link>
    );
  }

  const xp = user.progress?.leaderboardStats?.xp ?? user.progress?.xp ?? 0;
  const initials = user.isGuest
    ? "G"
    : (user.displayName || user.username)
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-paper/15 py-1 pl-1 pr-3 text-paper/80 transition-colors hover:border-paper/30"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-accent font-mono text-[9px] font-bold text-ink">
          {initials}
        </span>
        <span className="max-w-[120px] truncate font-mono text-[9px] uppercase tracking-[0.14em]">
          {user.isGuest ? "Guest" : user.displayName}
        </span>
        <div className="hidden sm:inline-flex items-center">
          <SplitFlapDisplay
            text={`${String(xp).padStart(4, " ")} XP`}
            columns={7}
            size="xs"
            showIndicators={false}
            className="p-0 border-0 bg-transparent shadow-none"
          />
        </div>
        <span className="sm:hidden font-mono text-[8px] tracking-[0.12em] text-accent">
          {xp} XP
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-[4px] border border-paper/10 bg-ink-2 text-paper shadow-2xl"
        >
          <div className="border-b border-paper/10 px-3.5 py-3">
            <p className="truncate text-[13px] font-medium">
              {user.isGuest ? "Guest session" : user.displayName}
            </p>
            <p className="mt-0.5 truncate font-mono text-[8px] uppercase tracking-[0.14em] text-paper/40">
              {user.isGuest ? "Guest Session" : "Demo Account"} · {xp} XP
            </p>
          </div>

          <Link
            href="/matcher"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-[12px] text-accent transition-colors hover:bg-white/[0.03]"
          >
            The Audition (Job Matcher)
          </Link>
          <Link
            href="/progress"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-[12px] transition-colors hover:bg-white/[0.03]"
          >
            My Progress
          </Link>
          <Link
            href="/onboarding"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-[12px] text-accent transition-colors hover:bg-white/[0.03]"
          >
            Calibrate Track
          </Link>
          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-[12px] transition-colors hover:bg-white/[0.03]"
          >
            Dashboard
          </Link>
          <Link
            href="/projects"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-[12px] transition-colors hover:bg-white/[0.03]"
          >
            Projects
          </Link>
          <Link
            href="/community"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-[12px] transition-colors hover:bg-white/[0.03]"
          >
            Community
          </Link>
          <Link
            href="/chat"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-[12px] transition-colors hover:bg-white/[0.03]"
          >
            Chat
          </Link>
          <Link
            href="/reports"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-[12px] transition-colors hover:bg-white/[0.03]"
          >
            Reports
          </Link>
          <Link
            href="/leaderboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-[12px] transition-colors hover:bg-white/[0.03]"
          >
            Leaderboard
          </Link>

          {user.isGuest ? (
            <Link
              href="/login?mode=signup&returnTo=/challenges"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block border-t border-paper/10 px-3.5 py-2.5 text-[12px] font-medium text-[#7bddaa] transition-colors hover:bg-white/[0.03]"
            >
              Create an account
            </Link>
          ) : null}

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="block w-full border-t border-paper/10 px-3.5 py-2.5 text-left text-[12px] text-paper/60 transition-colors hover:bg-white/[0.03] hover:text-paper"
          >
            Log Out
          </button>
        </div>
      ) : null}

      {toast ? (
        <div
          role="status"
          className="absolute right-0 top-[calc(100%+8px)] z-[60] rounded-[4px] border border-accent/40 bg-ink-2 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-accent shadow-xl"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
