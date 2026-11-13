"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DifficultyBadge from "@/components/DifficultyBadge";
import LanguageMark from "@/components/LanguageMark";
import { ArrowRight, Check, Sparkle } from "@/components/icons";
import { getDifficulty, getLanguage } from "@/lib/ui";
import { suggestNextChallenge } from "@/lib/mentor";
import { AUTH_EVENT, PROGRESS_EVENT } from "@/lib/auth";
import {
  clearSolvedChallenges,
  getActiveProgress,
  getSolvedChallengeIds,
} from "@/lib/progress";
import SplitFlapDisplay from "@/components/ui/split-flap-display";
import OrbitCardStack from "@/components/ui/orbit-card-stack";
import GithubCalendar from "@/components/ui/github-calendar";
import ScrollBasedVelocity from "@/components/ui/scroll-based-velocity";
import KineticTextReveal from "@/components/ui/kinetic-text-reveal";
import HarmonicRoadmap from "@/components/HarmonicRoadmap";

const pad = (value) => String(value).padStart(2, "0");

function readProgressState() {
  const progress = getActiveProgress();

  return {
    solvedIds: getSolvedChallengeIds(),
    unlockedPacks: progress?.unlockedPacks ?? [],
    stats: progress?.leaderboardStats ?? {
      xp: 0,
      streak: 0,
      hintsUsed: 0,
      totalAttempts: 0,
      challengesSolved: 0,
    },
  };
}

export default function ProgressBoard({ challenges }) {
  const router = useRouter();
  const [solvedIds, setSolvedIds] = useState(null);
  const [unlockedPacks, setUnlockedPacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [trackViewMode, setTrackViewMode] = useState("orbit");

  useEffect(() => {
    function sync() {
      const next = readProgressState();
      setSolvedIds(next.solvedIds);
      setUnlockedPacks(next.unlockedPacks);
      setStats(next.stats);
    }

    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener(PROGRESS_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener(PROGRESS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (solvedIds === null) {
      return;
    }

    let active = true;

    suggestNextChallenge({ solvedIds }).then((result) => {
      if (active) {
        setSuggestion(result);
      }
    });

    return () => {
      active = false;
    };
  }, [solvedIds]);

  const loaded = solvedIds !== null;
  const solvedSet = new Set(solvedIds ?? []);
  const solvedCount = challenges.filter((challenge) =>
    solvedSet.has(challenge.id)
  ).length;
  const progress = Math.round((solvedCount / challenges.length) * 100);
  const xp = stats?.xp ?? 0;
  const streak = stats?.streak ?? 0;
  const hintsUsed = stats?.hintsUsed ?? 0;
  const totalAttempts = stats?.totalAttempts ?? 0;

  // Group challenges by language for the track grid.
  const languageGroups = challenges.reduce((accumulator, challenge) => {
    if (!accumulator[challenge.language]) {
      accumulator[challenge.language] = [];
    }
    accumulator[challenge.language].push(challenge);
    return accumulator;
  }, {});

  const languageTracks = Object.keys(languageGroups)
    .map((language) => {
      const group = languageGroups[language];
      const total = group.length;
      const solved = group.filter((challenge) =>
        solvedSet.has(challenge.id)
      ).length;
      const percentage = total ? Math.round((solved / total) * 100) : 0;

      const byDifficulty = ["easy", "medium", "hard"].reduce(
        (accumulator, difficulty) => {
          const subset = group.filter(
            (challenge) => challenge.difficulty === difficulty
          );
          accumulator[difficulty] = {
            solved: subset.filter((challenge) =>
              solvedSet.has(challenge.id)
            ).length,
            total: subset.length,
          };
          return accumulator;
        },
        {}
      );

      return { language, total, solved, percentage, byDifficulty };
    })
    .sort((a, b) =>
      getLanguage(a.language).label.localeCompare(
        getLanguage(b.language).label
      )
    );

  function handleReset() {
    const next = clearSolvedChallenges();
    const fresh = readProgressState();
    setSolvedIds(next);
    setStats(fresh.stats);
  }

  const trackOrbitCards = languageTracks.map((track, i) => {
    const meta = getLanguage(track.language);
    return {
      id: track.language,
      name: meta.label,
      title: `${meta.label} Studio Track`,
      role: `TRACK 0${i + 1} · ${track.total} LEVELS`,
      category: `${track.solved}/${track.total} SOLVED`,
      description: `Complete curriculum across ${track.total} levels: Easy syntax, Medium data structures, and Hard algorithmic patterns.`,
      stat: `${track.percentage}% COMPLETE`,
      percentage: track.percentage,
      statusLabel: track.solved > 0 ? `${track.solved}/${track.total} Solved` : "Ready to Start",
      actionLabel: "Explore Levels",
      accent: meta.cover?.accent || ["#d9f65a", "#78dcca", "#b9a7ff", "#f8d66d", "#ff9d77"][i % 5],
      href: `/progress/${track.language}`,
      solved: track.solved > 0,
    };
  });

  const saptakSkills = [
    {
      name: "Syntax & Variables",
      category: "Fundamental",
      status: (solvedCount || 0) >= 1 ? "mastered" : "learning",
      challengeId: challenges.find((c) => c.difficulty === "easy")?.id || "py-01",
      matchPercentage: Math.min(100, Math.round(((solvedCount || 0) / 3) * 100)),
      details: "Basic language statements, data types, variable declarations, and standard I/O.",
    },
    {
      name: "Control Flow & Slices",
      category: "Fundamental",
      status: (solvedCount || 0) >= 3 ? "mastered" : "learning",
      challengeId: challenges.find((c) => c.difficulty === "easy")?.id || "py-02",
      matchPercentage: Math.min(100, Math.round(((solvedCount || 0) / 6) * 100)),
      details: "Conditionals, iterative loops, string manipulation, and list slices.",
    },
    {
      name: "Data Structures & Collections",
      category: "Mid Harmonics",
      status: (solvedCount || 0) >= 6 ? "mastered" : "learning",
      challengeId: challenges.find((c) => c.difficulty === "medium")?.id || "py-03",
      matchPercentage: Math.min(100, Math.round(((solvedCount || 0) / 10) * 100)),
      details: "Hash maps, hash sets, queues, stacks, and associative lookup tables.",
    },
    {
      name: "Functions & Recursion",
      category: "Mid Harmonics",
      status: (solvedCount || 0) >= 10 ? "mastered" : "learning",
      challengeId: challenges.find((c) => c.difficulty === "medium")?.id || "py-04",
      matchPercentage: Math.min(100, Math.round(((solvedCount || 0) / 15) * 100)),
      details: "Higher-order functions, closures, recursive base cases, and decorators.",
    },
    {
      name: "Object-Oriented & Modularity",
      category: "Mid Harmonics",
      status: (solvedCount || 0) >= 15 ? "mastered" : "learning",
      challengeId: challenges.find((c) => c.difficulty === "medium")?.id || "py-05",
      matchPercentage: Math.min(100, Math.round(((solvedCount || 0) / 20) * 100)),
      details: "Classes, interfaces, inheritance, composition, and package encapsulation.",
    },
    {
      name: "Concurrency & Event Loops",
      category: "Overtones",
      status: (solvedCount || 0) >= 20 ? "mastered" : "learning",
      challengeId: challenges.find((c) => c.difficulty === "hard")?.id || "py-06",
      matchPercentage: Math.min(100, Math.round(((solvedCount || 0) / 25) * 100)),
      details: "Async/await routines, thread synchronization, channels, and non-blocking I/O.",
    },
    {
      name: "Distributed Systems & Cloud",
      category: "Overtones",
      status: unlockedPacks.includes("pack-docker-k8s") ? "mastered" : "marketplace_gap",
      packId: "pack-docker-k8s",
      matchPercentage: unlockedPacks.includes("pack-docker-k8s") ? 100 : 0,
      details: "Docker containers, Kubernetes pod topology, Redis caching, and Kafka streaming.",
    },
  ];

  return (
    <div>
      {/* 1. Solari Split-Flap Analog Telemetry Board */}
      <section className="mb-8 rounded-[3px] border border-paper/10 bg-black/40 p-5">
        <div className="flex items-center justify-between mb-4 border-b border-paper/10 pb-2.5">
          <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-accent font-semibold flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Solari Telemetry Readout · Station 02
          </span>
          <span className="font-mono text-[8px] uppercase tracking-wider text-paper/30 hidden sm:inline">
            Live Account Progress Telemetry
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-paper/40">
              XP Balance
            </span>
            <SplitFlapDisplay
              text={`${String(xp).padStart(5, "0")} XP`}
              columns={8}
              size="sm"
              accentColor="#d9f65a"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-paper/40">
              Daily Streak
            </span>
            <SplitFlapDisplay
              text={`${String(streak).padStart(2, "0")} DAYS`}
              columns={7}
              size="sm"
              accentColor="#d9f65a"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-paper/40">
              Challenges Solved
            </span>
            <SplitFlapDisplay
              text={`${String(solvedCount).padStart(2, "0")} SOLVED`}
              columns={9}
              size="sm"
              accentColor="#d9f65a"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-paper/40">
              Run Attempts
            </span>
            <SplitFlapDisplay
              text={`${String(totalAttempts).padStart(3, "0")} RUNS`}
              columns={8}
              size="sm"
              accentColor="#d9f65a"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
              Overall completion
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/40">
              {loaded ? `${progress}%` : "reading…"}
            </p>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className="font-display text-[clamp(3.6rem,7vw,5.4rem)] leading-[0.8] tracking-[-0.04em]">
              {loaded ? solvedCount : "—"}
            </span>
            <span className="pb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-paper/60">
              / {challenges.length}
            </span>
          </div>

          <div
            className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={challenges.length}
            aria-valuenow={loaded ? solvedCount : 0}
            aria-label="Challenges solved"
          >
            <div
              className="h-full rounded-full bg-ink transition-[width] duration-500"
              style={{ width: `${loaded ? progress : 0}%` }}
            />
          </div>

          <div className="mt-7 grid grid-cols-3 gap-4 border-t border-paper/10 pt-5">
            {["easy", "medium", "hard"].map((difficulty) => {
              const meta = getDifficulty(difficulty);
              const group = challenges.filter(
                (challenge) => challenge.difficulty === difficulty
              );
              const solved = group.filter((challenge) =>
                solvedSet.has(challenge.id)
              ).length;
              const partial = group.length
                ? Math.round((solved / group.length) * 100)
                : 0;

              return (
                <div key={difficulty}>
                  <p className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-paper/60">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: meta.hex }}
                      aria-hidden="true"
                    />
                    {meta.label}
                  </p>
                  <p className="mt-2 font-display text-2xl leading-none">
                    {loaded ? solved : "—"}
                    <span className="ml-1 font-mono text-[9px] text-paper/40">
                      / {group.length}
                    </span>
                  </p>
                  <div className="mt-2 h-px w-full bg-paper/10">
                    <div
                      className="h-px"
                      style={{
                        backgroundColor: meta.hex,
                        width: `${loaded ? partial : 0}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[3px] bg-ink p-6 text-paper lg:p-8">
          <div className="grain absolute inset-0 opacity-40" aria-hidden="true" />

          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.24em] text-paper/40">
              <Sparkle className="h-3 w-3 text-accent" />
              Mentor suggests
            </div>

            <h2 className="mt-4 font-display text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.02] tracking-[-0.03em]">
              {suggestion?.challenge?.title ?? "Finding the next groove…"}
            </h2>

            <p className="mt-3 flex-1 text-[13px] leading-relaxed text-paper/50">
              {suggestion?.reason ??
                "Reading your saved progress and picking a sensible next pressing."}
            </p>

            {suggestion?.challenge ? (
              <Link
                href={`/challenges/${suggestion.challenge.id}`}
                className="group mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[12px] font-semibold text-ink"
              >
                Open pressing
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            ) : null}

            <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.16em] text-paper/25">
              Mock recommendation · /api/recommendation later
            </p>
          </div>
        </section>
      </div>

      {/* GitHub Solve Activity Telemetry Heatmap */}
      <div className="mt-8 mb-6">
        <GithubCalendar
          solvedCount={solvedCount}
          streak={streak}
          username="Studio Account"
        />
      </div>

      {/* Retro-Vinyl Spine Marquee */}
      <div className="my-8 py-2 border-y border-paper/10 bg-black/50 text-paper/40 font-mono text-[9px] uppercase tracking-[0.24em] overflow-hidden">
        <ScrollBasedVelocity
          text="HEXBIT PROGRESS CRATE · 1050 CHALLENGES · REAL TEST TELEMETRY · 10 RUNTIMES · ZERO RESUME FLUFF · "
          default_velocity={2.5}
          className="text-paper/40 hover:text-accent transition-colors"
        />
      </div>

      {/* Saptak Harmonic Frequency Acoustic Soundwave Roadmap */}
      <section className="my-8 rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-paper/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-accent font-semibold">
                Harmonic Frequency Spectrum · Saptak Scale
              </span>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[7px] uppercase tracking-wider text-accent border border-accent/20">
                Acoustic Career Waves
              </span>
            </div>
            <h3 className="mt-1 font-display text-[22px] text-paper">
              <KineticTextReveal text="Harmonic Resonance Roadmap" blur={true} />
            </h3>
            <p className="font-mono text-[11px] text-paper/50">
              Vibrating 7-note acoustic frequency ribbon. Neon nodes resonate with solved mastery; ghost bands link to the Marketplace Plugin Rack.
            </p>
          </div>
        </div>

        <HarmonicRoadmap
          skills={saptakSkills}
          unlockedPacks={unlockedPacks}
          onOpenMarketplace={() => router.push("/matcher")}
          onSelectChallenge={(challengeId) => router.push(`/challenges/${challengeId}/solve`)}
        />
      </section>

      {/* 2. Language Tracks - Interactive Orbit Card Stack & Grid View */}
      <section className="my-10 rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paper/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-accent font-semibold">
                Language Tracks · Orbit Shelf
              </span>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[7px] uppercase tracking-wider text-accent border border-accent/20">
                10 Languages Active
              </span>
            </div>
            <h3 className="mt-1 font-display text-[22px] text-paper">
              <KineticTextReveal text="Curriculum Pressings by Language" blur={true} />
            </h3>
            <p className="font-mono text-[11px] text-paper/50">
              Hover to fan out or use arrow keys (← →) to orbit through language tracks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="flex items-center rounded-[3px] border border-paper/15 bg-ink p-0.5 font-mono text-[9px] uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setTrackViewMode("orbit")}
                className={`rounded-[2px] px-2.5 py-1 transition-colors ${
                  trackViewMode === "orbit"
                    ? "bg-accent text-ink font-bold"
                    : "text-paper/60 hover:text-paper"
                }`}
              >
                ✦ Orbit Stack
              </button>
              <button
                type="button"
                onClick={() => setTrackViewMode("grid")}
                className={`rounded-[2px] px-2.5 py-1 transition-colors ${
                  trackViewMode === "grid"
                    ? "bg-accent text-ink font-bold"
                    : "text-paper/60 hover:text-paper"
                }`}
              >
                ⊞ Grid View
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              disabled={!loaded || solvedCount === 0}
              className="rounded-[3px] border border-paper/15 bg-ink px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-paper/50 hover:text-paper hover:border-paper/30 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Reset Progress
            </button>
          </div>
        </div>

        {/* Orbit Stack View */}
        {trackViewMode === "orbit" ? (
          <div className="my-4">
            <OrbitCardStack
              items={trackOrbitCards}
              defaultActiveIndex={Math.floor(trackOrbitCards.length / 2)}
              spread={140}
            />
          </div>
        ) : (
          /* Grid View */
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {languageTracks.map((track) => {
              const meta = getLanguage(track.language);

              return (
                <Link
                  key={track.language}
                  href={`/progress/${track.language}`}
                  className="group relative flex flex-col overflow-hidden rounded-[3px] border border-paper/10 bg-ink-2 p-5 transition-colors hover:bg-ink-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <LanguageMark language={track.language} showLabel />
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/40">
                      {track.solved} / {track.total}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="font-display text-[clamp(1.6rem,3vw,2.2rem)] leading-none tracking-[-0.03em]">
                      {loaded ? `${track.percentage}%` : "—"}
                    </p>
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.16em] text-paper/40">
                      {track.solved} of {track.total} levels solved
                    </p>
                  </div>

                  <div
                    className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={track.total}
                    aria-valuenow={loaded ? track.solved : 0}
                    aria-label={`${meta.label} progress`}
                  >
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-500"
                      style={{
                        width: `${loaded ? track.percentage : 0}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {["easy", "medium", "hard"].map((difficulty) => {
                      const entry = track.byDifficulty[difficulty];
                      const metaDifficulty = getDifficulty(difficulty);

                      return (
                        <span
                          key={difficulty}
                          className="inline-flex items-center gap-1.5 rounded-full border border-paper/10 bg-ink-3 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-paper/60"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: metaDifficulty.hex }}
                            aria-hidden="true"
                          />
                          {entry.solved}/{entry.total}
                        </span>
                      );
                    })}
                  </div>

                  <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-paper transition-transform duration-300 group-hover:translate-x-1">
                    Explore levels
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
