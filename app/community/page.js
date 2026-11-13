import CommunityBoard from "@/components/CommunityBoard";
import RequireAuth from "@/components/RequireAuth";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = { title: "Community", description: "Developer discussion hub." };

export default function CommunityPage() {
  return (
    <>
      <SiteHeader active="community" />
      <main id="main" className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
        <RequireAuth label="Loading community…">
          <CommunityBoard />
        </RequireAuth>
      </main>
      <SiteFooter />
    </>
  );
}
