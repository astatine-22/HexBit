"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ArrowRight, Sparkle } from "@/components/icons";
import { loginAsGuest } from "@/lib/auth";

/**
 * Wraps the workspace. Browsing challenges stays public; starting one asks for
 * a session, and either choice returns the user to this exact workspace.
 */
export default function SolveGate({ challenge, children }) {
  const { user, loading, refresh } = useAuth();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0d0b] text-paper">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/40">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border border-paper/20 border-t-accent" />
          Opening the workspace…
        </div>
      </div>
    );
  }

  if (user) {
    return children;
  }

  async function handleGuest() {
    if (busy) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = loginAsGuest();

      if (!result.ok) {
        throw new Error(result.error || "Could not start a guest session.");
      }

      refresh();
    } catch (caught) {
      setError(caught.message || "Could not start a guest session.");
    } finally {
      setBusy(false);
    }
  }

  const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";

  return (
    <div className="flex min-h-screen flex-col bg-[#0c0d0b] text-paper">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-paper/10 px-4 lg:h-16 lg:px-6">
        <Link
          href="/challenges"
          className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/45 transition-colors hover:text-paper"
        >
          ← Back to shelf
        </Link>
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-paper/30">
          CodeMentor / workspace
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <section className="w-full max-w-lg rounded-[4px] border border-paper/12 bg-[#121410] p-7 sm:p-9">
          <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-accent">
            <Sparkle className="h-3 w-3" />
            Session required
          </p>

          <h1 className="mt-4 font-display text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.02] tracking-[-0.03em]">
            Log in to open{" "}
            <span className="italic text-accent">{challenge?.title ?? "this pressing"}</span>.
          </h1>

          <p className="mt-4 text-[14px] leading-relaxed text-paper/55">
            Your attempts, hints, XP, and solved pressings are saved to your
            account. You can also continue as a guest — nothing is blocked, but
            guest progress only lives in this browser until you create an
            account.
          </p>

          {error ? (
            <p
              role="alert"
              className="mt-5 rounded-[3px] border border-[#bf5741]/30 bg-[#bf5741]/10 px-3 py-2 font-mono text-[10px] text-[#ee917c]"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href={`/login${next}`}
              className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-[13px] font-semibold text-ink transition-opacity hover:opacity-90"
            >
              Log in
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <button
              type="button"
              onClick={handleGuest}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-paper/20 px-5 py-3 text-[13px] font-medium text-paper/80 transition-colors hover:border-paper/40 hover:text-paper disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border border-paper/20 border-t-paper" />
              ) : null}
              {busy ? "Starting…" : "Continue as guest"}
            </button>
          </div>

          <p className="mt-4 text-center font-mono text-[8px] uppercase tracking-[0.16em] text-paper/30">
            New here?{" "}
            <Link href={`/login?mode=signup${next ? `&${next.slice(1)}` : ""}`} className="text-paper/60 underline-offset-4 hover:text-accent hover:underline">
              Create an account
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
