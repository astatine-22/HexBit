import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = { title: "Profile", description: "Public developer profile." };

export default async function PublicProfilePage({ params }) {
  const { username } = await params;
  return (
    <>
      <SiteHeader active="profile" />
      <main id="main" className="mx-auto max-w-4xl px-6 py-10 lg:px-10 lg:py-14">
        <div className="rounded-[3px] border border-paper/10 bg-ink-2 p-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
            Public profile
          </p>
          <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-[1] tracking-[-0.03em]">
            @{username}
          </h1>
          <p className="mt-2 text-[13px] text-paper/50">
            Developer card · solved badges · showcase projects · global rank.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["Solved badges", "Showcase projects", "Global rank"].map((label) => (
              <div key={label} className="rounded-[3px] border border-paper/10 bg-ink-3 p-4">
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-paper/40">{label}</p>
                <p className="mt-2 font-display text-xl">—</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
