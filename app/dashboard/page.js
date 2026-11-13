import DashboardBoard from "@/components/DashboardBoard";
import RequireAuth from "@/components/RequireAuth";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "Dashboard",
  description: "Your CodeMentor command center.",
};

export default function DashboardPage() {
  return (
    <>
      <SiteHeader active="dashboard" />
      <main id="main" className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
        <RequireAuth label="Loading your dashboard…">
          <DashboardBoard />
        </RequireAuth>
      </main>
      <SiteFooter />
    </>
  );
}
