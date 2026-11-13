import LanguageLevelsBoard from "@/components/LanguageLevelsBoard";
import RequireAuth from "@/components/RequireAuth";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getLanguage } from "@/lib/ui";

export async function generateMetadata({ params }) {
  const { language } = await params;
  const meta = getLanguage(language);

  return {
    title: `${meta.label} Track Progress`,
    description: `Level-by-level progress for the ${meta.label} track.`,
  };
}

export default async function LanguageProgressPage({ params }) {
  const { language } = await params;
  const meta = getLanguage(language);

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
                  Vol. 01 — {meta.label} track
                </div>
                <h1 className="mt-5 font-display text-[clamp(3.2rem,7vw,5.8rem)] leading-[0.82] tracking-[-0.045em]">
                  {meta.label}<span className="text-accent">.</span>
                </h1>
                <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-paper/55">
                  Every level in the {meta.label} track, with completion status,
                  difficulty, and estimated time. Click any level to open the
                  workspace.
                </p>
              </div>

              <div className="grid h-16 w-16 place-items-center rounded-[4px] border border-paper/25 bg-paper/5 font-mono text-[18px] font-semibold text-paper/90">
                {meta.glyph}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
          <RequireAuth label="Loading your levels…">
            <LanguageLevelsBoard />
          </RequireAuth>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
