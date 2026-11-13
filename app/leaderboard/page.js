import Leaderboard from "@/components/Leaderboard";
import RequireAuth from "@/components/RequireAuth";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "Leaderboard",
  description:
    "CodeMentor accounts ranked by XP, solved pressings, and daily streak.",
};

export default function LeaderboardPage() {
  return (
    <>
      <SiteHeader active="leaderboard" />

      <main id="main">
        <section className="relative overflow-hidden bg-ink text-paper">
          <div className="grain absolute inset-0 opacity-40" aria-hidden="true" />

          <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-12 lg:px-10 lg:pb-12 lg:pt-16">
            <div className="flex flex-wrap items-end justify-between gap-8">
              <div className="rise">
                <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em] text-paper/45">
                  <span className="h-px w-8 bg-accent/70" aria-hidden="true" />
                  Vol. 01 — the board
                </div>
                <h1 className="mt-5 font-display text-[clamp(3.2rem,7vw,5.8rem)] leading-[0.82] tracking-[-0.045em]">
                  Leaderboard<span className="text-accent">.</span>
                </h1>
                <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-paper/55">
                  XP for every first solve, a daily streak for showing up, and
                  hint counts for honesty. Ranked accounts only — guest sessions
                  stay private to this browser.
                </p>
              </div>

              <p className="rounded-full border border-paper/15 px-4 py-2 font-mono text-[8px] uppercase tracking-[0.18em] text-paper/40">
                localStorage · codementor_users
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
          <RequireAuth label="Reading the leaderboard…">
            <Leaderboard />
          </RequireAuth>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
