import { notFound } from "next/navigation";
import SolveWorkspace from "@/components/SolveWorkspace";
import { getChallengeById } from "@/lib/challenges";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const challenge = await getChallengeById(id);

  if (!challenge) {
    return { title: "Pressing not found" };
  }

  return {
    title: `${challenge.title} — Workspace`,
    description: `Solve ${challenge.title} in the CodeMentor workspace.`,
  };
}

export default async function SolvePage({ params }) {
  const { id } = await params;
  const challenge = await getChallengeById(id);

  if (!challenge) {
    notFound();
  }

  return <SolveWorkspace challenge={challenge} />;
}