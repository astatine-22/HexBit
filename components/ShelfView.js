"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import DifficultyBadge from "@/components/DifficultyBadge";
import DifficultyLegend from "@/components/DifficultyLegend";
import LanguageMark from "@/components/LanguageMark";
import { ArrowRight, Check, ChevronLeft, ChevronRight } from "@/components/icons";
import { getSolvedChallengeIds } from "@/lib/progress";
import { coverStyle, getDifficulty, getLanguage } from "@/lib/ui";

const pad = (value) => String(value).padStart(2, "0");

export default function ShelfView({ challenges }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [solvedIds, setSolvedIds] = useState([]);
  const total = challenges.length;
  const active = challenges[activeIndex];
  const activeDifficulty = getDifficulty(active.difficulty);
  const activeLanguage = getLanguage(active.language);
  const activeSolved = solvedIds.includes(active.id);

  useEffect(() => {
    setSolvedIds(getSolvedChallengeIds());
  }, []);

  const step = useCallback(
    (direction) => {
      setActiveIndex((current) => (current + direction + total) % total);
    },
    [total]
  );

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      const tag = event.target?.tagName;

      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        event.target?.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
      step(event.key === "ArrowLeft" ? -1 : 1);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step]);

  return (
    <>
      <section
        className="relative overflow-hidden bg-ink text-paper"
        aria-label="Challenge shelf"
      >
        <div className="grain absolute inset-0 opacity-40" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex items-center justify-between gap-4 border-t border-paper/10 pt-5 font-mono text-[9px] uppercase tracking-[0.28em] text-paper/40">
            <span>The shelf · {total} pressings</span>
            <span className="hidden sm:inline">← → to browse</span>
            <span aria-live="polite" className="text-paper/60">
              {pad(activeIndex + 1)} / {pad(total)}
            </span>
          </div>

          {/* Desktop / tablet carousel */}
          <div className="shelf-stage mt-2 hidden md:block">
            <div className="shelf-glow" aria-hidden="true" />

            {challenges.map((challenge, index) => {
              let offset = index - activeIndex;

              if (offset > total / 2) offset -= total;
              if (offset < -total / 2) offset += total;

              const distance = Math.abs(offset);
              const isActive = offset === 0;
              const isFar = distance > 3;
              const difficulty = getDifficulty(challenge.difficulty);
              const language = getLanguage(challenge.language);
              const solved = solvedIds.includes(challenge.id);

              return (
                <Link
                  key={challenge.id}
                  href={`/challenges/${challenge.id}`}
                  className={`shelf-card group ${
                    isActive ? "is-active" : ""
                  } ${isFar ? "is-far" : ""}`}
                  style={{
                    ...coverStyle(challenge.language),
                    "--offset": offset,
                    "--depth": `${-Math.min(distance, 5) * 36}px`,
                    "--rot": `${Math.max(-16, Math.min(16, offset * -5))}deg`,
                    "--diff": difficulty.hex,
                    zIndex: isActive ? 40 : 30 - distance,
                  }}
                  tabIndex={isFar ? -1 : 0}
                  aria-label={`${challenge.title} — ${difficulty.label}, ${language.label}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <div className="record-peek" aria-hidden="true">
                    <div className="record-disc" />
                  </div>

                  <div
                    className="cover-face"
                    style={coverStyle(challenge.language)}
                  >
                    <div className="cover-grain" aria-hidden="true" />
                    <div className="cover-rings" aria-hidden="true" />

                    <div className="cover-body relative z-10 flex h-full flex-col justify-between">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-paper/45">
                            No. {pad(index + 1)}
                          </p>
                          {solved ? (
                            <p className="mt-2 inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.2em] text-accent">
                              <Check className="h-3 w-3" />
                              solved
                            </p>
                          ) : null}
                        </div>
                        <LanguageMark language={challenge.language} tone="dark" />
                      </div>

                      <div>
                        <p
                          className="font-mono text-[9px] uppercase tracking-[0.24em]"
                          style={{ color: language.cover.accent }}
                        >
                          {challenge.category}
                        </p>
                        <h2 className="cover-title mt-2 line-clamp-3 font-display leading-[1.02] tracking-[-0.03em] text-paper">
                          {challenge.title}
                        </h2>
                        <div className="mt-4 flex items-center justify-between gap-2">
                          <DifficultyBadge
                            difficulty={challenge.difficulty}
                            tone="dark"
                          />
                          <span className="font-mono text-[9px] text-paper/50">
                            {challenge.estimatedMinutes} min
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/10 pt-3">
                        <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-paper/45">
                          Open pressing
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-paper/70 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>

                  <div className="spine">
                    <span className="spine-accent" aria-hidden="true" />
                    <span className="font-mono text-[8px] tracking-[0.14em] text-paper/45">
                      {pad(index + 1)}
                    </span>
                    <span className="spine-title">{challenge.title}</span>
                    <span className="grid place-items-center">
                      <span
                        className="grid h-6 w-6 place-items-center rounded-[3px] border border-paper/20 font-mono text-[8px] leading-none"
                        style={{ color: language.cover.accent }}
                      >
                        {language.glyph}
                      </span>
                    </span>
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: difficulty.hex }}
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              );
            })}

            <div className="shelf-board" aria-hidden="true" />

            <button
              type="button"
              onClick={() => step(-1)}
              className="shelf-arrow absolute left-0 top-[45%] z-50 -translate-y-1/2"
              aria-label="Previous challenge"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              className="shelf-arrow absolute right-0 top-[45%] z-50 -translate-y-1/2"
              aria-label="Next challenge"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile: the shelf becomes a vertical crate */}
          <div className="mt-6 space-y-2.5 pb-10 md:hidden">
            {challenges.map((challenge, index) => {
              const difficulty = getDifficulty(challenge.difficulty);
              const language = getLanguage(challenge.language);
              const solved = solvedIds.includes(challenge.id);

              return (
                <Link
                  key={challenge.id}
                  href={`/challenges/${challenge.id}`}
                  className="group flex items-center gap-4 rounded-[3px] border border-paper/10 bg-paper/[0.04] p-3 transition-colors hover:border-paper/25 hover:bg-paper/[0.07]"
                >
                  <span
                    className="relative grid h-16 w-12 shrink-0 place-items-center overflow-hidden rounded-[2px] border border-paper/15"
                    style={coverStyle(challenge.language)}
                  >
                    <span className="cover-grain" aria-hidden="true" />
                    <span
                      className="relative font-mono text-[11px] font-semibold"
                      style={{ color: language.cover.accent }}
                    >
                      {language.glyph}
                    </span>
                    <span
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ backgroundColor: difficulty.hex }}
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.22em] text-paper/40">
                      No. {pad(index + 1)} · {language.label}
                      {solved ? (
                        <span className="inline-flex items-center gap-1 text-accent">
                          <Check className="h-3 w-3" /> solved
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1.5 block truncate font-display text-lg leading-tight text-paper">
                      {challenge.title}
                    </span>
                    <span className="mt-1.5 flex items-center gap-2">
                      <DifficultyBadge
                        difficulty={challenge.difficulty}
                        tone="dark"
                      />
                      <span className="font-mono text-[9px] text-paper/40">
                        {challenge.estimatedMinutes} min
                      </span>
                    </span>
                  </span>

                  <ArrowRight className="h-4 w-4 shrink-0 text-paper/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-paper/80" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Scrubber + active challenge */}
      <section className="border-b border-line bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div key={active.id} className="rise">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[9px] uppercase tracking-[0.28em] text-muted">
                <span className="text-ink">No. {pad(activeIndex + 1)}</span>
                <span className="h-px w-8 bg-line" aria-hidden="true" />
                <span>{activeLanguage.label}</span>
                <span className="text-muted-2">{active.category}</span>
                {activeSolved ? (
                  <span className="inline-flex items-center gap-1 text-[#1f6a48]">
                    <Check className="h-3 w-3" />
                    solved
                  </span>
                ) : null}
              </div>

              <h2 className="mt-3 font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.95] tracking-[-0.035em]">
                {active.title}
              </h2>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                <DifficultyBadge difficulty={active.difficulty} />
                <span className="h-1 w-1 rounded-full bg-line" aria-hidden="true" />
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                  {active.estimatedMinutes} min
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-line sm:block" aria-hidden="true" />
                <span className="hidden max-w-md text-sm text-muted sm:line-clamp-1">
                  {active.description}
                </span>
              </div>
            </div>

            <Link
              href={`/challenges/${active.id}`}
              className="group inline-flex w-fit items-center gap-3 rounded-full bg-ink px-6 py-3.5 text-[12px] font-medium text-paper transition-transform duration-200 hover:-translate-y-0.5"
            >
              View pressing
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-10">
            <div className="relative">
              <div
                className="absolute inset-x-0 top-10 h-px bg-line"
                aria-hidden="true"
              />
              <div className="relative flex items-end">
                {challenges.map((challenge, index) => {
                  const difficulty = getDifficulty(challenge.difficulty);
                  const isActive = index === activeIndex;

                  return (
                    <button
                      key={challenge.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className="group flex flex-1 flex-col items-center"
                      aria-label={`${challenge.title}, ${difficulty.label}`}
                      aria-current={isActive ? "true" : undefined}
                    >
                      <span className="flex h-10 items-end">
                        <span
                          className="scrub-tick w-[4px] rounded-full"
                          style={{
                            backgroundColor: difficulty.hex,
                            height: isActive ? 34 : 14,
                            width: isActive ? 5 : 4,
                            opacity: isActive ? 1 : 0.5,
                            boxShadow: isActive
                              ? `0 0 0 4px ${difficulty.hex}1f, 0 0 20px ${difficulty.hex}66`
                              : "none",
                          }}
                        />
                      </span>
                      <span
                        className={`mt-2.5 font-mono text-[9px] transition-colors ${
                          isActive
                            ? "text-ink"
                            : "text-muted-2 group-hover:text-muted"
                        }`}
                      >
                        {pad(index + 1)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-2">
              One tick per pressing · color = difficulty
            </p>
            <DifficultyLegend />
          </div>
        </div>
      </section>
    </>
  );
}