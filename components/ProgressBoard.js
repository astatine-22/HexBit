"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DifficultyBadge from "@/components/DifficultyBadge";
import { ArrowRight, Check, Sparkle } from "@/components/icons";
import { getDifficulty, getLanguage } from "@/lib/ui";
import { suggestNextChallenge } from "@/lib/mentor";
import {
  clearSolvedChallenges,
  getSolvedChallengeIds,
} from "@/lib/progress";

const pad = (value) => String(value).padStart(2, "0");

export default function ProgressBoard({ challenges }) {
  const [solvedIds, setSolvedIds] = useState(null);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    setSolvedIds(getSolvedChallengeIds());
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

  function handleReset() {
    setSolvedIds(clearSolvedChallenges());
  }

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <section className="rounded-[3px] border border-line bg-white/40 p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-muted-2">
              Solved pressings
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-2">
              {loaded ? `${progress}%` : "reading…"}
            </p>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className="font-display text-[clamp(3.6rem,7vw,5.4rem)] leading-[0.8] tracking-[-0.04em]">
              {loaded ? solvedCount : "—"}
            </span>
            <span className="pb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              / {challenges.length}
            </span>
          </div>

          <div
            className="mt-6 h-1.5 overflow-hidden rounded-full bg-paper-3"
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

          <div className="mt-7 grid grid-cols-3 gap-4 border-t border-line pt-5">
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
                  <p className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: meta.hex }}
                      aria-hidden="true"
                    />
                    {meta.label}
                  </p>
                  <p className="mt-2 font-display text-2xl leading-none">
                    {loaded ? solved : "—"}
                    <span className="ml-1 font-mono text-[9px] text-muted-2">
                      / {group.length}
                    </span>
                  </p>
                  <div className="mt-2 h-px w-full bg-line">
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
                "Reading your local progress and picking a sensible next pressing."}
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

      <section className="mt-10 overflow-hidden rounded-[3px] border border-line">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/40 px-5 py-3.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted">
            The crate · all pressings
          </p>
          <button
            type="button"
            onClick={handleReset}
            disabled={!loaded || solvedCount === 0}
            className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted underline-offset-4 transition-colors hover:text-ink hover:underline disabled:cursor-not-allowed disabled:opacity-35"
          >
            Reset local progress
          </button>
        </div>

        <ul className="divide-y divide-line">
          {challenges.map((challenge, index) => {
            const solved = solvedSet.has(challenge.id);
            const language = getLanguage(challenge.language);

            return (
              <li key={challenge.id}>
                <Link
                  href={`/challenges/${challenge.id}/solve`}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/50"
                >
                  <span className="w-7 shrink-0 font-mono text-[9px] text-muted-2">
                    {pad(index + 1)}
                  </span>

                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
                      solved
                        ? "border-[#2f7d58] bg-[#2f7d58] text-paper"
                        : "border-line text-transparent"
                    }`}
                    aria-label={solved ? "Solved" : "Not solved"}
                  >
                    <Check className="h-3 w-3" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium tracking-[-0.01em]">
                      {challenge.title}
                    </span>
                    <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.16em] text-muted-2">
                      {language.label} · {challenge.category}
                    </span>
                  </span>

                  <span className="hidden shrink-0 sm:block">
                    <DifficultyBadge difficulty={challenge.difficulty} />
                  </span>
                  <span className="hidden w-12 shrink-0 text-right font-mono text-[9px] text-muted-2 md:block">
                    {challenge.estimatedMinutes}m
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-2 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ink" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}