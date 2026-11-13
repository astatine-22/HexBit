import Link from "next/link";

const GITHUB_REPO = "https://github.com/astatine-22/HexBit";

export default function SiteFooter() {
  return (
    <footer className="border-t border-paper/10 bg-ink-2 text-paper/60">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em] text-paper/35">
              <span className="h-px w-8 bg-accent/70" aria-hidden="true" />
              Side B · the fine print
            </p>

            <pre className="mt-4 max-w-md overflow-hidden rounded-[3px] border border-paper/15 bg-ink-3/80 px-4 py-3 font-mono text-[11px] leading-relaxed text-accent/90">
              <code>
                {`while (alive) {
  learn();
  build();
  ship();
}`}
              </code>
            </pre>

            <p className="mt-4 max-w-xl text-[12px] leading-relaxed text-paper/45">
              CodeMentor is a practice shelf for developers. Accounts, progress,
              and sessions are stored locally in your browser for the demo.
            </p>
          </div>

          <div className="flex flex-col gap-3 font-mono text-[9px] uppercase tracking-[0.18em] text-paper/40">
            <span className="text-paper/25">Built by</span>
            <ul className="space-y-1.5 text-[10px] normal-case tracking-normal text-paper hover:text-accent transition-colors">
              <li>Sanat Naik</li>
              <li>Akshay Surya</li>
              <li>Ashevk Deuskar</li>
            </ul>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex w-fit items-center gap-2 rounded-full border border-paper/20 px-4 py-2 text-[9px] uppercase tracking-[0.16em] text-paper/70 transition-colors hover:border-accent/50 hover:text-accent"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.491.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-paper/10 pt-5 font-mono text-[8px] uppercase tracking-[0.18em] text-paper/25 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} CodeMentor · All rights reserved.</span>
          <span>CodeMentor™ · practice shelf</span>
        </div>
      </div>
    </footer>
  );
}