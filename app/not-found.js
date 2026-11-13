import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { ArrowLeft } from "@/components/icons";

export const metadata = {
  title: "Pressing not found",
};

export default function NotFound() {
  return (
    <>
      <SiteHeader active="shelf" />

      <main
        id="main"
        className="flex min-h-[62vh] items-center bg-paper px-6 py-16 lg:px-10"
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-2xl">
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-2">
              404 — empty sleeve
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.8rem,6.5vw,5rem)] leading-[0.9] tracking-[-0.04em]">
              This pressing isn&rsquo;t in the crate.
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted">
              The challenge may have been re-shelved, or the link may have a typo.
              The twelve current pressings are still in order.
            </p>
            <Link
              href="/challenges"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[12px] font-medium text-paper"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              Back to shelf
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}