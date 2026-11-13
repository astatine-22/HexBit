"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getSolvedChallengeIds } from "@/lib/progress";
import { getChallenges } from "@/lib/challenges";

export default function ReportsBoard() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [solvedSet, setSolvedSet] = useState(new Set());

  useEffect(() => {
    let active = true;
    (async () => {
      const list = await getChallenges();
      if (!active) return;
      setChallenges(list);
      setSolvedSet(new Set(getSolvedChallengeIds()));
    })();
    return () => { active = false; };
  }, []);

  const xp = user?.progress?.leaderboardStats?.xp ?? user?.progress?.xp ?? 0;
  const streak = user?.progress?.leaderboardStats?.streak ?? user?.progress?.streak ?? 0;
  const solved = solvedSet.size;
  const total = challenges.length || 1;
  const pct = Math.round((solved / total) * 100);

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
          Performance report
        </p>
        <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-[1] tracking-[-0.03em]">
          Your <span className="italic text-accent">progress.</span>
        </h1>
        <button
          type="button"
          onClick={handlePrint}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-paper/20 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.16em] text-paper/70 hover:border-accent/50 hover:text-accent"
        >
          Export to PDF
        </button>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Completion", value: `${pct}%` },
          { label: "XP", value: xp },
          { label: "Streak", value: `${streak}d` },
          { label: "Solved", value: `${solved}/${total}` },
        ].map((s) => (
          <div key={s.label} className="rounded-[3px] border border-paper/10 bg-ink-2 p-5">
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-paper/40">{s.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
          Strengths vs weaknesses
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[3px] border border-[#8fe0b7]/20 bg-[#8fe0b7]/5 p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8fe0b7]">Strengths</p>
            <p className="mt-2 text-[12px] text-paper/60">Syntax, Strings, Control Flow</p>
          </div>
          <div className="rounded-[3px] border border-[#ee917c]/20 bg-[#ee917c]/5 p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#ee917c]">Weaknesses</p>
            <p className="mt-2 text-[12px] text-paper/60">Algorithms, Data Structures</p>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          header, footer, nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
