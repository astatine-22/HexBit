import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { ArrowRight } from "@/components/icons";

export const metadata = {
  title: "About",
  description:
    "How the CodeMentor shelf works, what is mocked in this preview, and where the swappable integrations live.",
};

const MODULES = [
  {
    path: "lib/challenges.js",
    label: "Data",
    note: "Twelve challenge pressings behind async getChallenges() and getChallengeById(id). Swap the mock array for Supabase queries here — nothing above it needs to change.",
  },
  {
    path: "lib/executor.js",
    label: "Runtime",
    note: "The workspace calls exactly runCode(language, code). Today it is a small mock that reads printed literals; later it becomes a Next.js route that proxies Piston.",
  },
  {
    path: "lib/mentor.js",
    label: "Mentor",
    note: "requestHint() and suggestNextChallenge() are the AI surface. They return local mock responses and carry the TODO for /api/hint and /api/recommendation.",
  },
  {
    path: "lib/auth.js",
    label: "Accounts",
    note: "localStorage accounts under codementor_users, with a per-user salt and a SHA-256 password digest. Sessions live in localStorage or sessionStorage depending on Remember me. Swappable for a real backend later.",
  },
  {
    path: "lib/progress.js",
    label: "Progress",
    note: "XP, streak, attempts, hints, and solved ids read and write the active account's progress object through one adapter. Guests get the same shape with isGuest: true.",
  },
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader active="about" />

      <main id="main">
        <section className="relative overflow-hidden bg-ink text-paper">
          <div className="grain absolute inset-0 opacity-40" aria-hidden="true" />

          <div className="relative mx-auto max-w-7xl px-6 pb-12 pt-12 lg:px-10 lg:pb-16 lg:pt-16">
            <div className="rise max-w-4xl">
              <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em] text-paper/45">
                <span className="h-px w-8 bg-accent/70" aria-hidden="true" />
                About — the idea
              </div>
              <h1 className="mt-5 font-display text-[clamp(3rem,7.4vw,6.2rem)] leading-[0.84] tracking-[-0.045em]">
                A record shop for <span className="italic text-accent">practice</span>.
              </h1>
              <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-paper/55">
                Most challenge sites feel like a spreadsheet. CodeMentor treats
                each challenge like a pressing in a crate: spines to browse, a
                cover to pull out, a brief to read, then a quiet workspace to
                make something work.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-paper/40">
                The short version
              </p>
              <p className="mt-4 font-display text-2xl leading-snug tracking-[-0.02em]">
                Browse a shelf, read a brief, run a mock, ask for one nudge at a
                time.
              </p>
              <p className="mt-4 text-[13px] leading-relaxed text-paper/60">
                No paid services, no network calls, no server database.
                Accounts, sessions, and progress all live in this browser so the
                interaction can be judged on its own terms.
              </p>
              <Link
                href="/challenges"
                className="group mt-6 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-paper"
              >
                Back to the shelf
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </aside>

            <div className="space-y-14">
              <section>
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-paper/40">
                  01 — The interaction
                </p>
                <div className="mt-4 grid gap-6 border-t border-paper/10 pt-6 sm:grid-cols-2">
                  <div>
                    <h2 className="font-display text-2xl tracking-[-0.02em]">
                      Browse like a crate
                    </h2>
                    <p className="mt-3 text-[14px] leading-relaxed text-paper/60">
                      Unselected challenges narrow into book spines with vertical
                      titles and a difficulty stripe. The centered pressing opens
                      into a full cover, complete with a record sliding out of the
                      sleeve. Arrows and a color-coded scrubber move through the
                      shelf.
                    </p>
                  </div>
                  <div>
                    <h2 className="font-display text-2xl tracking-[-0.02em]">
                      Work like a studio
                    </h2>
                    <p className="mt-3 text-[14px] leading-relaxed text-paper/60">
                      The detail page is deliberately read-only: read the brief,
                      inspect the starter pressing, then start the challenge. The
                      workspace splits Monaco from the console, with a collapsible
                      mentor docked underneath.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-paper/40">
                  02 — What is mocked
                </p>
                <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-paper/60">
                  The seams are deliberate. Each integration is isolated in one
                  module with a TODO, so replacing a mock does not mean rewriting
                  a component.
                </p>
                <div className="mt-6 divide-y divide-line border-y border-paper/10">
                  {MODULES.map((module) => (
                    <div
                      key={module.path}
                      className="grid gap-3 py-5 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-8"
                    >
                      <div>
                        <p className="font-mono text-[10px] tracking-[0.04em] text-paper">
                          {module.path}
                        </p>
                        <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.18em] text-paper/40">
                          {module.label} · swappable
                        </p>
                      </div>
                      <p className="text-[13px] leading-relaxed text-paper/60">
                        {module.note}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-paper/40">
                  03 — The build
                </p>
                <div className="mt-4 grid gap-6 border-t border-paper/10 pt-6 sm:grid-cols-2">
                  <ul className="space-y-2.5 text-[13px] text-paper/60">
                    {[
                      "Next.js App Router with server-rendered routes",
                      "Tailwind CSS v4 with a custom theme",
                      "Monaco editor loaded client-side only",
                      "Twelve challenges across ten languages",
                      "Exact-match solved state, saved per account",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span
                          className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink/40"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-[3px] border border-paper/10 bg-ink-2 p-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/40">
                      Deliberately out of scope
                    </p>
                    <p className="mt-3 text-[13px] leading-relaxed text-paper/60">
                      No real execution and no live hint API. Auth is demo-grade
                      localStorage only: passwords are salted and SHA-256 hashed,
                      but clearing storage or switching browsers starts fresh.
                    </p>
                  </div>
                </div>
              </section>

              <section className="relative overflow-hidden rounded-[3px] bg-ink p-7 text-paper lg:p-9">
                <div className="grain absolute inset-0 opacity-40" aria-hidden="true" />
                <div className="relative flex flex-wrap items-end justify-between gap-6">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-paper/40">
                      Side A · ready
                    </p>
                    <h2 className="mt-3 font-display text-[clamp(1.9rem,3.4vw,2.8rem)] leading-none tracking-[-0.03em]">
                      Pull a pressing off the shelf.
                    </h2>
                  </div>
                  <Link
                    href="/challenges"
                    className="group inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[12px] font-semibold text-ink"
                  >
                    Browse challenges
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}