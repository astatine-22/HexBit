import ProjectsBoard from "@/components/ProjectsBoard";
import RequireAuth from "@/components/RequireAuth";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = { title: "Projects", description: "Guided projects." };

export default function ProjectsPage() {
  return (
    <>
      <SiteHeader active="projects" />
      <main id="main" className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
        <RequireAuth label="Loading projects…">
          <ProjectsBoard />
        </RequireAuth>
      </main>
      <SiteFooter />
    </>
  );
}
