import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-2 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <p>CodeMentor — practice on the shelf</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span>Mock data · local progress</span>
          <Link
            href="/about"
            className="text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            About this build
          </Link>
        </div>
      </div>
    </footer>
  );
}