import Link from "next/link";
import { notFound } from "next/navigation";
import CodePreview from "@/components/CodePreview";
import DifficultyBadge from "@/components/DifficultyBadge";
import LanguageMark from "@/components/LanguageMark";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { getChallengeById, getChallenges } from "@/lib/challenges";
import { getDifficulty, getLanguage } from "@/lib/ui";

const pad = (value) => String(value).padStart(2, "0");

export async function generateMetadata({ params }) {
  const { id } = await params;
  const challenge = await getChallengeById(id);

  if (!challenge) {
    return { title: "Pressing not found" };
  }

  return {
    title: challenge.title,
    description: challenge.description,
  };
}

export default async function ChallengeDetailPage({ params }) {
  const { id } = await params;
  const [challenge, challenges] = await Promise.all([
    getChallengeById(id),
    getChallenges(),
  ]);

  if (!challenge) {
    notFound();
  }

  const index = challenges.findIndex((item) => item.id === challenge.id);
  const difficulty = getDifficulty(challenge.difficulty);
  const language = getLanguage(challenge.language);

  return (
    <>
      <SiteHeader active="shelf" />

      <main id="main" className="bg-ink">
        <div className="mx-auto max-w-7xl px-6 pt-8 lg:px-10 lg:pt-10">
          <Link
            href="/challenges"
            className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/60 transition-colors hover:text-paper"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
            Back to shelf
          </Link>
        </div>

        <article className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
          <header className="mt-8 grid gap-12 border-b border-paper/10 pb-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16 lg:pb-16">
            <div className="rise">
              <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.24em] text-paper/60">
                <span className="text-paper">
                  No. {pad(index + 1)} / {pad(challenges.length)}
                </span>
                <span className="h-px w-6 bg-line" aria-hidden="true" />
                <span>{language.label}</span>
                <span className="text-paper/40">{challenge.category}</span>
              </div>

              <h1 className="mt-5 font-display text-[clamp(2.8rem,5.6vw,4.8rem)] leading-[0.92] tracking-[-0.04em]">
                {challenge.title}
              </h1>

              <p className="mt-6 max-w-2xl text-[16px] leading-[1.75] text-paper/60">
                {challenge.description}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-2">
                <DifficultyBadge difficulty={challenge.difficulty} />
                {challenge.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-paper/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-paper/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <aside>
              <div className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:sticky lg:top-24">
                <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
                  On this pressing
                </p>

                <dl className="mt-5 divide-y divide-line/80 border-y border-paper/10/80">
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-[13px] text-paper/60">Language</dt>
                    <dd>
                      <LanguageMark
                        language={challenge.language}
                        showLabel
                        className="[&>span:last-child]:text-paper"
                      />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-[13px] text-paper/60">Difficulty</dt>
                    <dd>
                      <DifficultyBadge difficulty={challenge.difficulty} />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-[13px] text-paper/60">Category</dt>
                    <dd className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper">
                      {challenge.category}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-[13px] text-paper/60">Estimated</dt>
                    <dd className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper">
                      {challenge.estimatedMinutes} min
                    </dd>
                  </div>
                </dl>

                <Link
                  href={`/challenges/${challenge.id}/solve`}
                  className="group mt-6 flex w-full items-center justify-between gap-3 rounded-full bg-ink px-5 py-4 text-[13px] font-medium text-paper transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Start Challenge
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <p className="mt-3 text-center font-mono text-[8px] uppercase tracking-[0.16em] text-paper/40">
                  Monaco editor · mock runtime
                </p>
              </div>
            </aside>
          </header>

          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
                  01 — Prep
                </p>
                <h2 className="mt-2 font-display text-[clamp(1.7rem,3vw,2.3rem)] leading-tight tracking-[-0.02em]">
                  The starter pressing
                </h2>
              </div>
              <p className="max-w-sm text-[13px] leading-relaxed text-paper/60">
                Read it, trace it, then open the workspace. The editor starts
                from this exact file.
              </p>
            </div>

            <CodePreview
              code={challenge.starterCode}
              language={challenge.language}
              className="mt-6"
            />
          </section>

          <section className="mt-16 grid gap-8 border-t border-paper/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                number: "01",
                title: "Read the brief",
                copy: "One paragraph, one expected result. No hidden requirements.",
              },
              {
                number: "02",
                title: "Make a first pass",
                copy: "Run the mock runtime and see what your print statements say.",
              },
              {
                number: "03",
                title: "Ask the mentor",
                copy: "Stuck? Request a nudge. Hints arrive one step at a time.",
              },
              {
                number: "04",
                title: "Mark it solved",
                copy: "Matching output flips the checkmark and saves local progress.",
              },
            ].map((item) => (
              <div key={item.number}>
                <p className="font-mono text-[9px] tracking-[0.2em] text-paper/40">
                  {item.number}
                </p>
                <h3 className="mt-2 text-[14px] font-semibold tracking-[-0.01em]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-paper/60">
                  {item.copy}
                </p>
              </div>
            ))}
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}