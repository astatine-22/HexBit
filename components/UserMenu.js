"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { logout } from "@/lib/auth";

function initials(name) {
  const value = String(name ?? "").trim();
  if (!value) {
    return "?";
  }

  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default function UserMenu({ tone = "dark" }) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
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

  function handleLogout() {
    setOpen(false);
    // Session only. Protected pages redirect themselves via RequireAuth.
    logout();
  }

  if (loading) {
    return (
      <span
        className={`h-8 w-8 animate-pulse rounded-full border ${
          tone === "dark" ? "border-paper/15 bg-paper/5" : "border-line bg-paper-3"
        }`}
        aria-hidden="true"
      />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={`rounded-full border px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
          tone === "dark"
            ? "border-paper/20 text-paper/70 hover:border-accent/50 hover:text-accent"
            : "border-line text-muted hover:border-ink/40 hover:text-ink"
        }`}
      >
        Log in
      </Link>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-colors ${
          tone === "dark"
            ? "border-paper/15 text-paper/80 hover:border-paper/30"
            : "border-line text-ink hover:border-ink/30"
        }`}
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-accent font-mono text-[9px] font-bold text-ink">
          {user.isGuest ? "G" : initials(user.displayName)}
        </span>
        <span className="max-w-[120px] truncate font-mono text-[9px] uppercase tracking-[0.14em]">
          {user.isGuest ? "Guest" : user.displayName}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 overflow-hidden rounded-[4px] border border-line bg-paper text-ink shadow-2xl"
        >
          <div className="border-b border-line px-3.5 py-3">
            <p className="truncate text-[13px] font-medium">
              {user.isGuest ? "Guest session" : user.displayName}
            </p>
            <p className="mt-0.5 truncate font-mono text-[8px] uppercase tracking-[0.14em] text-muted-2">
              {user.isGuest ? "progress not saved to an account" : `@${user.username}`}
            </p>
          </div>

          <Link
            href="/progress"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-[12px] transition-colors hover:bg-paper-2"
          >
            Progress
          </Link>
          <Link
            href="/leaderboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-[12px] transition-colors hover:bg-paper-2"
          >
            Leaderboard
          </Link>

          {user.isGuest ? (
            <Link
              href="/login?mode=signup&migrate=1"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block border-t border-line px-3.5 py-2.5 text-[12px] font-medium text-[#2f7d58] transition-colors hover:bg-paper-2"
            >
              Create an account
            </Link>
          ) : null}

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="block w-full border-t border-line px-3.5 py-2.5 text-left text-[12px] text-muted transition-colors hover:bg-paper-2 hover:text-ink"
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
