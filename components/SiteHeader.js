import Link from "next/link";

const NAV_ITEMS = [
  { href: "/challenges", label: "Challenges", key: "shelf" },
  { href: "/progress", label: "Progress", key: "progress" },
  { href: "/about", label: "About", key: "about" },
];

export default function SiteHeader({ active = "shelf" }) {
  return (
    <header className="sticky top-0 z-50 border-b border-paper/10 bg-ink/95 text-paper backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 lg:px-10">
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
          className="-mr-2 flex items-center gap-0.5"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === active;

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative px-2.5 py-2 text-[12px] tracking-[0.01em] transition-colors sm:px-3 sm:text-[13px] ${
                  isActive
                    ? "text-paper"
                    : "text-paper/55 hover:text-paper/90"
                }`}
              >
                {item.label}
                {isActive ? (
                  <span className="absolute inset-x-2.5 bottom-0.5 h-px bg-accent sm:inset-x-3" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-paper/40 lg:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          mock mode
        </div>
      </div>
    </header>
  );
}