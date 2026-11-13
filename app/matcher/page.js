import JobMatcherBoard from "@/components/JobMatcherBoard";
import RequireAuth from "@/components/RequireAuth";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "The Audition · Job-Description Matcher | CodeMentor",
  description:
    "Verify your job-readiness against your actual code, test execution, and completed pressings — no resume fluff.",
};

export default function MatcherPage() {
  return (
    <>
      <SiteHeader active="matcher" />
      <main id="main" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-14">
        <RequireAuth label="Loading audition studio…">
          <JobMatcherBoard />
        </RequireAuth>
      </main>
      <SiteFooter />
    </>
  );
}
