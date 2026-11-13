"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import DifficultyBadge from "@/components/DifficultyBadge";
import LanguageMark from "@/components/LanguageMark";
import { ArrowLeft, ArrowRight, Check } from "@/components/icons";
import { getDifficulty, getLanguage } from "@/lib/ui";
import { AUTH_EVENT, PROGRESS_EVENT } from "@/lib/auth";
import {
  getActiveProgress,
  getSolvedChallengeIds,
} from "@/lib/progress";
import { getChallengesByLanguage } from "@/lib/challenges";

const pad = (value) => String(value).padStart(2, "0");

const DIFFICULTIES = ["all", "easy", "medium", "hard"];

function readSolved() {
  return new Set(getSolvedChallengeIds());
}

export default function LanguageLevelsBoard() {
  const params = useParams();
  const language = params?.language;

  const [challenges, setChallenges] = useState([]);
  const [solvedSet, setSolvedSet] = useState(new Set());
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [chapterFilter, setChapterFilter] = useState("all");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const list = await getChallengesByLanguage(language);
      if (!active) return;
      setChallenges(list);
      setSolvedSet(readSolved());
      setLoaded(true);
    }

    load();

    function sync() {
      setSolvedSet(readSolved());
    }

    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener(PROGRESS_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      active = false;
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener(PROGRESS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [language]);

  const meta = getLanguage(language);
  const chapters = useMemo(() => {
    const set = new Set(challenges.map((challenge) => challenge.category));
    return ["all", ...Array.from(set)];
  }, [challenges]);

  const filtered = useMemo(() => {
    return challenges.filter((challenge) => {
      if (difficultyFilter !== "all" && challenge.difficulty !== difficultyFilter) {
        return false;
      }
      if (chapterFilter !== "all" && challenge.category !== chapterFilter) {
        return false;
      }
      return true;
    });
  }, [challenges, difficultyFilter, chapterFilter]);

  const total = challenges.length;
  const solvedCount = challenges.filter((challenge) =>
    solvedSet.has(challenge.id)
  ).length;
  const percentage = total ? Math.round((solvedCount / total) * 100) : 0;

  if (!loaded) {
    return (
      <div className="flex min-h-[320px] items-center justify-center px-6 py-16">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border border-line border-t-ink" />
          Loading levels…
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/progress"
          className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to progress overview
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <LanguageMark language={language} showLabel />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-2">
            {solvedCount} / {total} solved · {percentage}%
          </span>
        </div>
      </div>

      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-paper-3">
        <div
          className="h-full rounded-full bg-ink transition-[width] duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {DIFFICULTIES.map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              onClick={() => setDifficultyFilter(difficulty)}
              className={`rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
                difficultyFilter === difficulty
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-muted hover:border-ink/40 hover:text-ink"
              }`}
            >
              {difficulty}
            </button>
          ))}
        </div>

        <select
          value={chapterFilter}
          onChange={(event) => setChapterFilter(event.target.value)}
          className="rounded-full border border-line bg-white px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted transition-colors hover:border-ink/40 focus:border-ink/40 focus:outline-none"
        >
          {chapters.map((chapter) => (
            <option key={chapter} value={chapter}>
              {chapter === "all" ? "All chapters" : chapter}
            </option>
          ))}
        </select>

        <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.16em] text-muted-2">
          {filtered.length} shown
        </span>
      </div>

      <ul className="divide-y divide-line overflow-hidden rounded-[3px] border border-line">
        {filtered.map((challenge, index) => {
          const solved = solvedSet.has(challenge.id);
          const difficultyMeta = getDifficulty(challenge.difficulty);

          return (
            <li key={challenge.id}>
              <Link
                href={`/challenges/${challenge.id}/solve`}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/50"
              >
                <span className="w-8 shrink-0 font-mono text-[9px] text-muted-2">
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
                  {solved ? <Check className="h-3 w-3" /> : null}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium tracking-[-0.01em]">
                    {challenge.title}
                  </span>
                  <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.16em] text-muted-2">
                    {challenge.category} · {challenge.estimatedMinutes}m
                  </span>
                </span>

                <span className="hidden shrink-0 sm:block">
                  <DifficultyBadge difficulty={challenge.difficulty} />
                </span>

                <span className="hidden w-14 shrink-0 text-right font-mono text-[9px] text-muted-2 md:block">
                  {difficultyMeta.label}
                </span>

                <ArrowRight className="h-4 w-4 shrink-0 text-muted-2 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ink" />
              </Link>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2">
          No levels match these filters.
        </p>
      ) : null}
    </div>
  );
}
