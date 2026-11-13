import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = { title: "Certificate", description: "Verifiable certificate." };

export default async function CertificatePage({ params }) {
  const { id } = await params;
  return (
    <>
      <SiteHeader active="certificate" />
      <main id="main" className="mx-auto max-w-4xl px-6 py-10 lg:px-10 lg:py-14">
        <div className="rounded-[3px] border border-[#f0d06a]/40 bg-ink-2 p-10 text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#f0d06a]">
            CodeMentor · Verified Certificate
          </p>
          <h1 className="mt-6 font-display text-[clamp(2rem,4vw,3rem)] leading-[1] tracking-[-0.03em]">
            Certificate of Completion
          </h1>
          <p className="mt-4 text-[14px] text-paper/60">
            Awarded to a CodeMentor learner for completing a track.
          </p>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/40">
            Verification ID: {id}
          </p>
          <p className="mt-2 font-mono text-[9px] text-paper/30">
            Issued {new Date().toLocaleDateString()}
          </p>
          <p className="mt-6 text-[11px] text-paper/40">
            Shareable link: /certificate/{id}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
