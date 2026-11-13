"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import LanguageMark from "@/components/LanguageMark";
import { ArrowRight, Check, Sparkle } from "@/components/icons";
import { getLanguage } from "@/lib/ui";
import { getSolvedChallengeIds } from "@/lib/progress";
import { getChallenges } from "@/lib/challenges";

const pad = (value) => String(value).padStart(2, "0");

const BADGES = [
  { id: "first-blood", label: "First Blood", desc: "Solve your first challenge" },
  { id: "loop-master", label: "Loop Master", desc: "Solve 5 loop challenges" },
  { id: "seven-day", label: "7-Day Beat", desc: "7-day solve streak" },
  { id: "speed-demon", label: "Speed Demon", desc: "Solve in under 5 min" },
];

export default function DashboardBoard() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [solvedSet, setSolvedSet] = useState(new Set());
  const [goalDate, setGoalDate] = useState("");
  const [goalStatus, setGoalStatus] = useState("On Track");

  useEffect(() => {
    let active = true;
    (async () => {
      const list = await getChallenges();
      if (!active) return;
      setChallenges(list);
      setSolvedSet(new Set(getSolvedChallengeIds()));
    })();
    return () => {
      active = false;
    };
  }, []);

  const rankMap = {
    beginner: "Apprentice (Foundations)",
    intermediate: "Practitioner (Logic & Slices)",
    advanced: "Specialist (Algorithms & Big-O)",
  };
  const personaMap = {
    socratic: "Socratic Guide (Clues Only)",
    direct: "Co-Pilot Mode (Direct Bug Spotter)",
    strict: "Staff Engineer (Big-O Rigor)",
  };

  const experienceLevel = user?.progress?.experienceLevel || "beginner";
  const learningStyle = user?.progress?.learningStyle || "socratic";
  const diagnosticScore = user?.progress?.diagnosticScore;
  const bonusXp = user?.progress?.bonusXp;
  const hasScore = diagnosticScore !== undefined && diagnosticScore !== null;

  const displayName = user?.displayName || user?.username || "astatine";
  const solvedCount = solvedSet.size;
  const streak = user?.progress?.leaderboardStats?.streak ?? user?.progress?.streak ?? 0;
  const xp = user?.progress?.leaderboardStats?.xp ?? user?.progress?.xp ?? 170;
  const mastery = challenges.length > 0 ? Math.round((solvedCount / challenges.length) * 100) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Skill radar categories
  const categoryGroups = {
    "Syntax & Basics": ["Syntax & Operators", "Variables & Types", "Basics"],
    "Control Flow & Loops": ["Control Flow", "Loops", "Conditionals"],
    "Collections & Slices": ["Strings", "Collections & Arrays", "Lists"],
    "Algorithms & Rigor": ["Searching & Sorting", "Algorithms", "Recursion"],
  };

  const skillRadar = Object.keys(categoryGroups).map((label) => {
    const cats = categoryGroups[label];
    const group = challenges.filter((c) => cats.includes(c.category));
    const total = group.length;
    const solved = group.filter((c) => solvedSet.has(c.id)).length;
    const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
    return { label, pct, total, solved };
  });

  const lowestSkill = skillRadar.reduce(
    (acc, s) => (s.total > 0 && s.pct < acc.pct ? s : acc),
    skillRadar[0] || { label: "", pct: 100, total: 0, solved: 0 }
  );

  const activeDays = Math.min(streak || (solvedCount > 0 ? 1 : 0), 7);
  const weeklyPct = Math.round((activeDays / 7) * 100);

  const firstChallenge = challenges
    .filter((c) => c.language === (user?.progress?.favoriteLanguage || "python"))
    .sort((a, b) => {
      const an = parseInt(a.id.split("-")[1], 10);
      const bn = parseInt(b.id.split("-")[1], 10);
      return an - bn;
    })[0];

  const weakTitle =
    solvedCount === 0 ? "Recommended Start" : `Weak area: ${lowestSkill.label}`;
  const weakText =
    solvedCount === 0
      ? "Begin with Level 1 to calibrate your syntax fundamentals."
      : `Your ${lowestSkill.label.toLowerCase()} mastery is lower than the rest — practice these drills.`;
  const weakButton = solvedCount === 0 ? "Start Level 1 →" : "Practice Category →";
  const weakHref =
    solvedCount === 0 && firstChallenge
      ? `/challenges/${firstChallenge.id}/solve`
      : "/challenges";

  const groups = challenges.reduce((acc, c) => {
    if (!acc[c.language]) acc[c.language] = [];
    acc[c.language].push(c);
    return acc;
  }, {});

  const trackProgress = Object.keys(groups).map((lang) => {
    const g = groups[lang];
    const s = g.filter((c) => solvedSet.has(c.id)).length;
    return { lang, total: g.length, solved: s, pct: Math.round((s / g.length) * 100) };
  });

  const nextChallenge = challenges.find((c) => !solvedSet.has(c.id));

  const earnedBadges = BADGES.filter((b) => {
    if (b.id === "first-blood") return solvedCount >= 1;
    if (b.id === "seven-day") return streak >= 7;
    return solvedCount >= 5;
  });

  return (
    <div className="space-y-8">
      {/* 1. Command Center (Good morning) */}
      <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-paper/40">
              Command center
            </p>
            <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-[1] tracking-[-0.03em]">
              {greeting}, <span className="italic text-accent">{displayName}</span>.
            </h1>
            <p className="mt-2 text-[13px] text-paper/50">
              {streak} day streak · {xp} XP · {solvedCount} solved
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
            <span className="h-2 w-2 rounded-full bg-accent" />
            {streak} days
          </div>
        </div>

        {/* Weekly goal */}
        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/40">
              Weekly goal · {activeDays} / 7 days active
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/60">
              {goalStatus}
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-accent" style={{ width: `${weeklyPct}%` }} />
          </div>
        </div>

        {/* Self-set goal */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/40">
            Complete a track by
          </label>
          <input
            type="date"
            value={goalDate}
            onChange={(e) => {
              setGoalDate(e.target.value);
              setGoalStatus(e.target.value ? "On Track" : "Needs Speedup");
            }}
            className="rounded-[3px] border border-paper/15 bg-ink-3 px-3 py-1.5 font-mono text-[10px] text-paper/80 focus:border-accent/60 focus:outline-none"
          />
          <span
            className={`rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] ${
              goalStatus === "On Track"
                ? "border-[#8fe0b7]/30 text-[#8fe0b7]"
                : "border-[#ee917c]/30 text-[#ee917c]"
            }`}
          >
            {goalStatus}
          </span>
        </div>
      </section>

      {/* 2. Side-A Personalized Mixtape */}
      <section className="relative overflow-hidden rounded-[3px] border border-accent/30 bg-ink-2 p-6 lg:p-8">
        <div className="grain absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="relative">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent">
            Side A · {displayName}'s {user?.progress?.favoriteLanguage || "Python"} Track
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.05] tracking-[-0.02em]">
            Personalized Mixtape
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Calibrated Rank", value: rankMap[experienceLevel] || "Apprentice (Foundations)" },
              { label: "Mentor Style", value: personaMap[learningStyle] || "Socratic Guide (Clues Only)" },
              { label: "Diagnostic Accuracy", value: hasScore ? `${diagnosticScore}/3` : "Self-Calibrated" },
              { label: "Starting Bonus XP", value: bonusXp ? `+${bonusXp} XP (Diagnostic Boost)` : "Standard Start (+50 XP)" },
            ].map((s) => (
              <div key={s.label} className="rounded-[3px] border border-paper/10 bg-ink-3 p-3">
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-paper/40">
                  {s.label}
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-paper">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
          {nextChallenge ? (
            <Link
              href={`/challenges/${nextChallenge.id}/solve`}
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[12px] font-semibold text-ink"
            >
              Resume calibrated level
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          ) : null}
        </div>
      </section>

      {/* 3. The Audition Teaser Banner */}
      <section className="relative overflow-hidden rounded-[3px] border border-paper/15 bg-gradient-to-r from-ink-2 via-[#181a13] to-ink-2 p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent text-lg">
              🎯
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-accent font-semibold">
                  The Audition
                </span>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[7px] uppercase tracking-wider text-accent border border-accent/20">
                  New Feature
                </span>
              </div>
              <h3 className="font-display text-[17px] text-paper mt-0.5">
                Targeting a specific engineering role?
              </h3>
              <p className="text-[12px] text-paper/60">
                Run an Audition against your real code telemetry to get verified match scores and a personalized gap playlist.
              </p>
            </div>
          </div>
          <Link
            href="/matcher"
            className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent transition-all hover:bg-accent hover:text-ink"
          >
            Run an Audition →
          </Link>
        </div>
      </section>



      {/* Continue learning + roadmap */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
        <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
            Continue learning
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.05] tracking-[-0.02em]">
            {nextChallenge ? nextChallenge.title : "All caught up!"}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-paper/50">
            {nextChallenge
              ? nextChallenge.description
              : "You've completed every available challenge."}
          </p>
          {nextChallenge ? (
            <Link
              href={`/challenges/${nextChallenge.id}/solve`}
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[12px] font-semibold text-ink"
            >
              Resume next level
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          ) : null}

          <div className="mt-8">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-paper/40">
              Mastery
            </p>
            <div className="mt-3 flex items-center gap-6">
              <div className="relative grid h-24 w-24 place-items-center rounded-full border-4 border-white/10">
                <span className="font-display text-2xl font-semibold">{mastery}%</span>
                <span
                  className="absolute inset-0 rounded-full border-4 border-accent"
                  style={{
                    clipPath: `inset(0 ${100 - mastery}% 0 0)`,
                  }}
                />
              </div>
              <div className="space-y-1.5">
                {["Locked", "In Progress", "Mastered"].map((state, i) => (
                  <div key={state} className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-paper/60">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: ["#4a4e44", "#d9f65a", "#7bddaa"][i],
                      }}
                    />
                    {state}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>



        <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
            Skill radar
          </p>
          <div className="mt-4 space-y-3">
            {skillRadar.map((skill) => (
              <div key={skill.label}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-paper/60">
                    {skill.label}
                  </span>
                  <span className="font-mono text-[9px] text-paper/40">
                    {skill.pct}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${skill.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {solvedCount === 0 ? (
            <p className="mt-4 text-[12px] text-paper/50">
              Solve challenges to build your skill telemetry.
            </p>
          ) : null}

          <div className="mt-6 rounded-[3px] border border-[#ee917c]/20 bg-[#ee917c]/5 p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#ee917c]">
              {weakTitle}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-paper/60">
              {weakText}
            </p>
            <Link
              href={weakHref}
              className="mt-3 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-accent hover:translate-x-1 transition-transform"
            >
              {weakButton}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </section>


      </div>

      {/* Activity & badges */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
            Weekly activity
          </p>
          <div className="mt-4 flex items-end gap-2">
            {[30, 55, 40, 70, 25, 60, 45].map((h, i) => (
              <div key={i} className="flex-1">
                <div
                  className="rounded-t-[2px] bg-accent/70"
                  style={{ height: `${h}px` }}
                />
                <p className="mt-1 text-center font-mono text-[7px] text-paper/30">
                  {["M", "T", "W", "T", "F", "S", "S"][i]}
                </p>
              </div>
            ))}
          </div>
        </section>



        <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
            Vinyl badge shelf
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {BADGES.map((badge) => {
              const earned = earnedBadges.some((b) => b.id === badge.id);
              return (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center gap-1 rounded-[3px] border px-3 py-2 ${
                    earned
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-paper/10 text-paper/30 opacity-50"
                  }`}
                >
                  <span className="font-mono text-[16px]">◉</span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.14em]">
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>


      </div>

      {/* Track progress grid */}
      <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
          Topic roadmap
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trackProgress.map((track) => (
            <Link
              key={track.lang}
              href={`/progress/${track.lang}`}
              className="flex items-center justify-between gap-3 rounded-[3px] border border-paper/10 bg-ink-3 px-4 py-3 transition-colors hover:border-accent/40"
            >
              <div className="flex items-center gap-2">
                <LanguageMark language={track.lang} />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/70">
                  {getLanguage(track.lang).label}
                </span>
              </div>
              <span className="font-mono text-[9px] text-paper/40">
                {track.solved}/{track.total}
              </span>
            </Link>
          ))}
        </div>
      </section>


    </div>
  );
}
