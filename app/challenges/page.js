import ShelfView from "@/components/ShelfView";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getChallenges } from "@/lib/challenges";

export const metadata = {
  title: "Challenges",
  description:
    "Browse the CodeMentor shelf: twelve coding challenges, ten languages, and difficulty-coded pressings.",
};

export default async function ChallengesPage() {
  const challenges = await getChallenges();
  const languageCount = new Set(challenges.map((item) => item.language)).size;
  const counts = challenges.reduce(
    (accumulator, challenge) => {
      accumulator[challenge.difficulty] =
        (accumulator[challenge.difficulty] ?? 0) + 1;
      return accumulator;
    },
    { easy: 0, medium: 0, hard: 0 }
  );

  return (
    <>
      <SiteHeader active="shelf" />

      <main id="main">
        <section className="relative overflow-hidden bg-ink text-paper">
          <div className="grain absolute inset-0 opacity-50" aria-hidden="true" />

          <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-12 lg:px-10 lg:pb-12 lg:pt-16">
            <div className="flex items-end justify-between gap-12">
              <div className="rise max-w-3xl">
                <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em] text-paper/45">
                  <span className="h-px w-8 bg-accent/70" aria-hidden="true" />
                  Vol. 01 — the practice shelf
                </div>

                <h1 className="mt-5 font-display text-[clamp(3.7rem,9.6vw,8.6rem)] leading-[0.8] tracking-[-0.05em]">
                  Code<span className="italic text-accent">Mentor</span>
                </h1>

                <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-paper/55">
                  Twelve pressings. Ten languages. Pull a spine off the shelf,
                  read the brief, then step into the workspace. Your mentor is
                  on standby — not on autopilot.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[9px] uppercase tracking-[0.2em] text-paper/40">
                  <span>{challenges.length} pressings</span>
                  <span
                    className="h-1 w-1 rounded-full bg-paper/20"
                    aria-hidden="true"
                  />
                  <span>{languageCount} languages</span>
                  <span
                    className="h-1 w-1 rounded-full bg-paper/20"
                    aria-hidden="true"
                  />
                  <span className="text-[#7bddaa]">{counts.easy} easy</span>
                  <span className="text-[#e7c266]">{counts.medium} medium</span>
                  <span className="text-[#ee917c]">{counts.hard} hard</span>
                </div>
              </div>

              <div
                className="relative hidden shrink-0 lg:block"
                aria-hidden="true"
              >
                <div className="vinyl-disc vinyl-spin h-[248px] w-[248px]">
                  <div className="vinyl-label">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                      CodeMentor
                    </span>
                    <span className="text-[7px] font-medium uppercase tracking-[0.18em]">
                      Practice pressing
                    </span>
                    <span className="mt-1 font-mono text-[9px] font-bold">
                      VOL. 01
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-3 -left-8 rounded-full border border-paper/15 bg-ink/80 px-3 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-paper/50 backdrop-blur">
                  33⅓ rpm
                </div>
              </div>
            </div>
          </div>
        </section>

        <ShelfView challenges={challenges} />
      </main>

      <SiteFooter />
    </>
  );
}