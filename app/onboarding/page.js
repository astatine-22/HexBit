import OnboardingFlow from "@/components/OnboardingFlow";
import RequireAuth from "@/components/RequireAuth";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Personalize Your Track",
  description: "Calibrate your language, experience level, and AI mentor style.",
};

export default function OnboardingPage() {
  return (
    <>
      <SiteHeader active="onboarding" />
      <main id="main" className="min-h-[calc(100vh-140px)] bg-ink">
        <RequireAuth label="Setting up your calibration…">
          <OnboardingFlow />
        </RequireAuth>
      </main>
      <SiteFooter />
    </>
  );
}
