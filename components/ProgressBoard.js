"use client";

import Link from "next/link";
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

const pad = (value) => String(value).padStart(2, "0");

function readProgressState() {
  const progress = getActiveProgress();

  return {
    solvedIds: getSolvedChallengeIds(),
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
  const [solvedIds, setSolvedIds] = useState(null);
  const [stats, setStats] = useState(null);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    function sync() {
      const next = readProgressState();
      setSolvedIds(next.solvedIds);
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

  return (
    <div>
      <section className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-paper/10 bg-paper/10 sm:grid-cols-4">
        {[
          { label: "XP", value: xp, hint: "+10 per first solve" },
          { label: "Daily streak", value: `${streak}d`, hint: "consecutive solve days" },
          { label: "Hints used", value: hintsUsed, hint: "across all pressings" },
          { label: "Run attempts", value: totalAttempts, hint: "all challenges" },
        ].map((item) => (
          <div key={item.label} className="bg-ink-2 px-5 py-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-paper/40">
              {item.label}
            </p>
            <p className="mt-2 font-display text-[clamp(1.7rem,3vw,2.2rem)] leading-none tracking-[-0.03em]">
              {loaded ? item.value : "—"}
            </p>
            <p className="mt-1.5 font-mono text-[7px] uppercase tracking-[0.14em] text-paper/40">
              {item.hint}
            </p>
          </div>
        ))}
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

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper/10 bg-ink-2 px-5 py-3.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-paper/60">
            Language tracks · explore a level list
          </p>
          <button
            type="button"
            onClick={handleReset}
            disabled={!loaded || solvedCount === 0}
            className="font-mono text-[9px] uppercase tracking-[0.16em] text-paper/60 underline-offset-4 transition-colors hover:text-paper hover:underline disabled:cursor-not-allowed disabled:opacity-35"
          >
            Reset my progress
          </button>
        </div>

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
                    className="h-full rounded-full bg-ink transition-[width] duration-500"
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
      </section>
    </div>
  );
}
