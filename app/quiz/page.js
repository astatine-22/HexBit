import QuizBoard from "@/components/QuizBoard";
import RequireAuth from "@/components/RequireAuth";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "Quiz",
  description: "Adaptive testing engine.",
};

export default function QuizPage() {
  return (
    <>
      <SiteHeader active="quiz" />
      <main id="main" className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
        <RequireAuth label="Loading quiz…">
          <QuizBoard />
        </RequireAuth>
      </main>
      <SiteFooter />
    </>
  );
}
