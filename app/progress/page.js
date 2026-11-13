import ProgressBoard from "@/components/ProgressBoard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getChallenges } from "@/lib/challenges";

export const metadata = {
  title: "Progress",
  description:
    "Checkmarks for solved CodeMentor pressings, kept locally for this preview.",
};

export default async function ProgressPage() {
  const challenges = await getChallenges();

  return (
    <>
      <SiteHeader active="progress" />

      <main id="main">
        <section className="relative overflow-hidden bg-ink text-paper">
          <div className="grain absolute inset-0 opacity-40" aria-hidden="true" />

          <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-12 lg:px-10 lg:pb-12 lg:pt-16">
            <div className="flex flex-wrap items-end justify-between gap-8">
              <div className="rise">
                <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em] text-paper/45">
                  <span className="h-px w-8 bg-accent/70" aria-hidden="true" />
                  Vol. 01 — your crate
                </div>
                <h1 className="mt-5 font-display text-[clamp(3.2rem,7vw,5.8rem)] leading-[0.82] tracking-[-0.045em]">
                  Progress<span className="text-accent">.</span>
                </h1>
                <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-paper/55">
                  Checkmarks live in this browser while the app is a preview.
                  The shape is already ready for a real account: one solved-state
                  adapter, one list, one recommendation.
                </p>
              </div>

              <p className="rounded-full border border-paper/15 px-4 py-2 font-mono text-[8px] uppercase tracking-[0.18em] text-paper/40">
                localStorage · codementor.solved.v1
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
          <ProgressBoard challenges={challenges} />
        </section>
      </main>

      <SiteFooter />
    </>
  );
}