"use client";

import Link from "next/link";
import { useState } from "react";
import GuestBanner from "@/components/GuestBanner";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/challenges", label: "Challenges", key: "shelf" },
  { href: "/matcher", label: "Audition", key: "matcher" },
  { href: "/progress", label: "Progress", key: "progress" },
  { href: "/leaderboard", label: "Leaderboard", key: "leaderboard" },
  { href: "/about", label: "About", key: "about" },
];

export default function SiteHeader({ active = "shelf" }) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-paper/10 bg-ink/95 text-paper backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-10">
        <Link
          href="/challenges"
          className="group flex shrink-0 items-center gap-3"
          aria-label="CodeMentor shelf"
        >
          <span className="relative grid h-8 w-8 place-items-center rounded-full border border-paper/25">
            <span className="absolute inset-[4px] rounded-full border border-paper/10" />
            <span className="font-display text-[15px] italic leading-none">
              C
            </span>
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="font-display text-[19px] tracking-[-0.02em]">
              CodeMentor
            </span>
            <span className="mt-1 font-mono text-[7px] uppercase tracking-[0.32em] text-paper/35">
              practice shelf
            </span>
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="-mr-1 flex items-center gap-0.5 sm:-mr-2"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === active;

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative px-1.5 py-2 text-[11px] tracking-[0.01em] transition-colors sm:px-3 sm:text-[13px] ${
                  isActive
                    ? "text-paper"
                    : "text-paper/55 hover:text-paper/90"
                }`}
              >
                {item.label}
                {isActive ? (
                  <span className="absolute inset-x-1.5 bottom-0.5 h-px bg-accent sm:inset-x-3" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative grid h-8 w-8 place-items-center rounded-full border border-paper/15 text-paper/70 transition-colors hover:border-accent/50 hover:text-accent"
              aria-label="Notifications"
            >
              <span className="text-[14px]">🔔</span>
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-accent font-mono text-[8px] font-bold text-ink">
                3
              </span>
            </button>
            {notifOpen ? (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 overflow-hidden rounded-[4px] border border-paper/10 bg-ink-2 text-paper shadow-2xl">
                <div className="border-b border-paper/10 px-3.5 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/40">
                    Notifications
                  </p>
                </div>
                <ul className="divide-y divide-paper/10">
                  {[
                    { text: "Streak reminder: solve a challenge today", type: "streak" },
                    { text: "New reply on your doubt in #python", type: "reply" },
                    { text: "Badge unlocked: Loop Master", type: "badge" },
                  ].map((n, i) => (
                    <li key={i} className="px-3.5 py-2.5 text-[12px] text-paper/70">
                      {n.text}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  onClick={() => setNotifOpen(false)}
                  className="block border-t border-paper/10 px-3.5 py-2.5 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-accent hover:bg-white/[0.03]"
                >
                  View all
                </Link>
              </div>
            ) : null}
          </div>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      <GuestBanner />
    </header>
  );
}
