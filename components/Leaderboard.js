"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ArrowRight, Sparkle } from "@/components/icons";
import { AUTH_EVENT, PROGRESS_EVENT } from "@/lib/auth";
import { getLeaderboard } from "@/lib/progress";

const pad = (value) => String(value).padStart(2, "0");

function Stat({ label, value }) {
  return (
    <div>
      <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-paper/40">
        {label}
      </p>
      <p className="mt-1 font-display text-xl leading-none">{value}</p>
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    function sync() {
      setRows(getLeaderboard());
    }

    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener(PROGRESS_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener(PROGRESS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const loaded = rows !== null;
  const ranked = rows ?? [];
  const currentRank = user
    ? ranked.find((row) => row.username === user.username)
    : null;
  const totalXp = ranked.reduce((sum, row) => sum + row.xp, 0);
  const totalSolved = ranked.reduce((sum, row) => sum + row.challengesSolved, 0);

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 text-paper lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
              Ranked accounts
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/40">
              {loaded ? `${ranked.length} on the board` : "reading…"}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-x-10 gap-y-4">
            <div className="flex items-end gap-3">
              <span className="font-display text-[clamp(3.2rem,6vw,4.6rem)] leading-[0.8] tracking-[-0.04em]">
                {loaded ? ranked.length : "—"}
              </span>
              <span className="pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/60">
                accounts
              </span>
            </div>

            <div className="grid flex-1 grid-cols-2 gap-4 border-l border-paper/10 pl-6 sm:grid-cols-3">
              <Stat label="Total XP" value={loaded ? totalXp : "—"} />
              <Stat label="Solved" value={loaded ? totalSolved : "—"} />
              <Stat
                label="Your rank"
                value={currentRank ? `#${currentRank.rank}` : user?.isGuest ? "guest" : "—"}
              />
            </div>
          </div>

          <p className="mt-6 border-t border-paper/10 pt-4 text-[13px] leading-relaxed text-paper/60">
            Ranked by XP, then solved pressings, then streak. Only real accounts
            appear here — guest sessions are never ranked, so two guests can
            never collide under one name.
          </p>
        </section>

        <section className="relative overflow-hidden rounded-[3px] border border-accent/30 bg-ink-3 p-6 text-paper lg:p-8">
          <div className="grain absolute inset-0 opacity-40" aria-hidden="true" />

          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.24em] text-paper/40">
              <Sparkle className="h-3 w-3 text-accent" />
              Your standing
            </div>

            <h2 className="mt-4 font-display text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.02] tracking-[-0.03em]">
              {user?.isGuest
                ? "Guests don't take a rank."
                : currentRank
                  ? `You're #${currentRank.rank} on the shelf.`
                  : "Your name is not on the board yet."}
            </h2>

            <p className="mt-3 flex-1 text-[13px] leading-relaxed text-paper/50">
              {user?.isGuest
                ? "Create an account from the guest banner to keep your XP, streak, and solved pressings — then you'll appear here."
                : currentRank
                  ? `${currentRank.xp} XP · ${currentRank.challengesSolved} solved · ${currentRank.streak}-day streak.`
                  : "Solve one challenge while signed in and your account appears on the leaderboard instantly."}
            </p>

            <Link
              href={user?.isGuest ? "/login?mode=signup&migrate=1" : "/challenges"}
              className="group mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[12px] font-semibold text-ink"
            >
              {user?.isGuest ? "Save my guest progress" : "Pull a pressing"}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </div>

      <section className="mt-10 overflow-hidden rounded-xl border border-paper/10 bg-ink-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper/10 bg-ink-3/60 px-5 py-3.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-paper/60">
            The board · all ranked accounts
          </p>
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-paper/40">
            displayName · codementor_users
          </p>
        </div>

        {!loaded ? (
          <p className="px-5 py-10 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-paper/40">
            Reading the board…
          </p>
        ) : ranked.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-display text-2xl tracking-[-0.02em]">
              No ranked accounts yet.
            </p>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-paper/60">
              Create an account or finish a challenge to put the first name on
              the board.
            </p>
            <Link
              href="/login?mode=signup"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[12px] font-medium text-paper"
            >
              Create an account
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-paper/10 bg-ink-3/60 font-mono text-[8px] uppercase tracking-[0.16em] text-paper/40">
                  <th className="px-5 py-3 font-normal">Rank</th>
                  <th className="px-3 py-3 font-normal">Account</th>
                  <th className="px-3 py-3 text-right font-normal">XP</th>
                  <th className="px-3 py-3 text-right font-normal">Solved</th>
                  <th className="px-3 py-3 text-right font-normal">Streak</th>
                  <th className="px-3 py-3 text-right font-normal">Hints</th>
                  <th className="px-5 py-3 text-right font-normal">Attempts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ranked.map((row) => {
                  const isCurrent = user?.username === row.username;

                  return (
                    <tr
                      key={row.username}
                      className={
                        isCurrent ? "bg-accent/10 border-l-2 border-l-accent text-paper" : "transition-colors hover:bg-white/[0.03]"
                      }
                    >
                      <td className="px-5 py-4">
                        {row.rank <= 3 ? (
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[10px] font-semibold ${
                              row.rank === 1
                                ? "text-[#f0d06a] border-[#f0d06a]/30 bg-[#f0d06a]/10"
                                : row.rank === 2
                                  ? "text-[#e3ddcd] border-white/20 bg-white/5"
                                  : "text-[#ee917c] border-[#ee917c]/30 bg-[#ee917c]/10"
                            }`}
                          >
                            {pad(row.rank)}
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-paper/40">
                            {pad(row.rank)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <span className="flex items-center gap-2">
                          <span className="text-[14px] font-medium tracking-[-0.01em]">
                            {row.displayName}
                          </span>
                          {isCurrent ? (
                            <span className="rounded-full border border-[#2f7d58]/25 bg-[#e3f2e9] px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.14em] text-[#1f6a48]">
                              YOU
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.14em] text-paper/40">
                          @{row.username}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right font-display text-lg leading-none">
                        {row.xp}
                      </td>
                      <td className="px-3 py-4 text-right font-mono text-[11px] text-paper/60">
                        {row.challengesSolved}
                      </td>
                      <td className="px-3 py-4 text-right font-mono text-[11px] text-paper/60">
                        {row.streak}d
                      </td>
                      <td className="px-3 py-4 text-right font-mono text-[11px] text-paper/60">
                        {row.hintsUsed}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-[11px] text-paper/60">
                        {row.totalAttempts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
