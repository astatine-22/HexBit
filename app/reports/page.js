import ReportsBoard from "@/components/ReportsBoard";
import RequireAuth from "@/components/RequireAuth";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = { title: "Reports", description: "Performance report." };

export default function ReportsPage() {
  return (
    <>
      <SiteHeader active="reports" />
      <main id="main" className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
        <RequireAuth label="Loading report…">
          <ReportsBoard />
        </RequireAuth>
      </main>
      <SiteFooter />
    </>
  );
}
