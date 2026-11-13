"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DifficultyBadge from "@/components/DifficultyBadge";
import LanguageMark from "@/components/LanguageMark";
import { getLanguageCurriculum } from "@/lib/challenges";
import { getSolvedChallengeIds } from "@/lib/progress";
import { useAuth } from "@/components/AuthProvider";
import { AUTH_EVENT, PROGRESS_EVENT } from "@/lib/auth";
import { coverStyle, getDifficulty, getLanguage } from "@/lib/ui";
import { Check, ChevronLeft, ChevronRight } from "@/components/icons";

const pad = (value) => String(value).padStart(2, "0");

export default function ShelfView({ challenges }) {
  const router = useRouter();
  const { user } = useAuth();
  const [viewState, setViewState] = useState({
    level: "languages",
    selectedLanguage: null,
    selectedChapter: null,
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [solvedIds, setSolvedIds] = useState([]);

  useEffect(() => {
    function sync() {
      setSolvedIds(getSolvedChallengeIds());
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
    if (!user?.progress?.favoriteLanguage || viewState.level !== "languages") return;
    const fav = user.progress.favoriteLanguage;
    const idx = languageEntries.findIndex((entry) => entry.id === fav);
    if (idx >= 0) setActiveIndex(idx);
  }, [user?.progress?.favoriteLanguage, viewState.level]);

  const curriculum = getLanguageCurriculum();
  const languageEntries = Object.keys(curriculum).map((key) => {
    const entry = curriculum[key];
    const languageChallenges =
      entry.chapters?.flatMap((chapter) => chapter.challenges) ?? [];
    const solved = languageChallenges.some((item) =>
      solvedIds.includes(item.id)
    );
    return {
      id: key,
      name: entry.name,
      glyph: entry.glyph,
      language: key,
      difficulty: languageChallenges[0]?.difficulty ?? "easy",
      challengeCount: languageChallenges.length,
      solved,
    };
  });

  const selectedLanguage = viewState.selectedLanguage
    ? curriculum[viewState.selectedLanguage] ?? null
    : null;
  const chapterList = selectedLanguage?.chapters ?? [];
  const selectedChapter =
    viewState.selectedChapter !== null
      ? chapterList.find((chapter) => chapter.id === viewState.selectedChapter) ??
        chapterList[0] ??
        null
      : chapterList[0] ??
        null;
  const chapterChallenges = selectedChapter?.challenges ?? [];

  const accentColor = viewState.selectedLanguage
    ? getLanguage(viewState.selectedLanguage).cover.accent
    : "#d4e157";

  const currentItems =
    viewState.level === "languages"
      ? languageEntries
      : viewState.level === "chapters"
        ? chapterList.map((chapter) => ({
            id: chapter.id,
            title: chapter.title,
            count: chapter.challenges.length,
          }))
        : chapterChallenges.map((challenge) => ({
            id: challenge.id,
            ...challenge,
          }));

  function openLanguage(languageId) {
    setActiveIndex(0);
    setViewState({
      level: "chapters",
      selectedLanguage: languageId,
      selectedChapter: null,
    });
  }

  function openChapter(chapterId) {
    setActiveIndex(0);
    setViewState((previous) => ({
      ...previous,
      level: "challenges",
      selectedChapter: chapterId,
    }));
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const delta = event.key === "ArrowRight" ? 1 : -1;
        setActiveIndex((current) =>
          currentItems.length === 0
            ? current
            : (current + delta + currentItems.length) % currentItems.length
        );
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const item = currentItems[activeIndex];
        if (viewState.level === "languages") {
          if (item) openLanguage(item.id);
        } else if (viewState.level === "chapters") {
          if (item) openChapter(item.id);
        } else if (viewState.level === "challenges") {
          if (item) router.push(`/challenges/${item.id}/solve`);
        }
      } else if (event.key === "Escape") {
        if (viewState.level === "chapters") {
          setViewState({
            level: "languages",
            selectedLanguage: null,
            selectedChapter: null,
          });
        } else if (viewState.level === "challenges") {
          setViewState((previous) => ({
            ...previous,
            level: "chapters",
            selectedChapter: null,
          }));
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <>
      {viewState.level === "languages" ? (
        <section
          className="relative overflow-hidden bg-ink text-paper"
          aria-label="Language shelf"
        >
          <div className="grain absolute inset-0 opacity-40" aria-hidden="true" />

          <div className="px-6 pb-16 lg:px-10">
            <div className="shelf-stage">
              <div className="shelf-glow" aria-hidden="true" />

              {languageEntries.map((item, index) => {
                const offset = index - activeIndex;
                const distance = Math.abs(offset);
                const isActive = offset === 0;
                const isFar = distance > 3;
                const difficulty = getDifficulty(item.difficulty);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openLanguage(item.id)}
                    className={`shelf-card group ${isActive ? "is-active" : ""} ${
                      isFar ? "is-far" : ""
                    }`}
                    style={{
                      ...coverStyle(item.language),
                      "--offset": offset,
                      "--depth": `${-Math.min(distance, 5) * 36}px`,
                      "--rot": `${Math.max(-16, Math.min(16, offset * -5))}deg`,
                      "--diff": difficulty.hex,
                      zIndex: isActive ? 40 : 30 - distance,
                    }}
                    tabIndex={isFar ? -1 : 0}
                    aria-label={`${item.name} — ${difficulty.label} language`}
                  >
                    <div className="record-peek" aria-hidden="true">
                      <div className="record-disc" />
                    </div>

                    <div
                      className="cover-face"
                      style={coverStyle(item.language)}
                    >
                      <div className="cover-grain" aria-hidden="true" />
                      <div className="cover-rings" aria-hidden="true" />
                      <div className="cover-body relative z-10 flex h-full flex-col justify-between">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-paper/45">
                              No. {pad(index + 1)}
                            </p>
                            {isActive && item.id === user?.progress?.favoriteLanguage ? (
                              <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-accent shadow-lg shadow-accent/20">
                                ✦ Your active A-side track · {user?.progress?.experienceLevel || "Apprentice"}
                              </p>
                            ) : item.id !== user?.progress?.favoriteLanguage ? (
                              <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.2em] text-paper/30">
                                Uncalibrated · Click to explore
                              </p>
                            ) : null}
                            {item.solved ? (
                              <p className="mt-2 inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.2em] text-accent">
                                <Check className="h-3 w-3" />
                                solved
                              </p>
                            ) : null}
                          </div>
                          <LanguageMark language={item.language} tone="dark" />
                        </div>

                        <div>
                          <p
                            className="font-mono text-[9px] uppercase tracking-[0.24em]"
                            style={{ color: getLanguage(item.language).cover.accent }}
                          >
                            {item.language}
                          </p>
                          <h2 className="cover-title mt-2 line-clamp-3 font-display leading-[1.02] tracking-[-0.03em] text-paper">
                            {item.name}
                          </h2>
                          <div className="mt-4 flex items-center justify-between gap-2">
                            <DifficultyBadge
                              difficulty={item.difficulty}
                              tone="dark"
                            />
                            <span className="font-mono text-[9px] text-paper/50">
                              {item.challengeCount} track
                              {item.challengeCount === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/10 pt-3">
                          <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-paper/45">
                            Open pressing
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-paper/70 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>

                    <div className="spine" aria-hidden="true">
                      <span className="spine-accent" />
                      <span className="spine-title">{item.name}</span>
                      <span className="grid place-items-center">
                        <span
                          className="grid h-6 w-6 place-items-center rounded-[3px] border border-paper/20 font-mono text-[8px] leading-none"
                          style={{ color: getLanguage(item.language).cover.accent }}
                        >
                          {item.glyph}
                        </span>
                      </span>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: difficulty.hex }}
                      />
                    </div>
                  </button>
                );
              })}

              <div className="shelf-board" aria-hidden="true" />

              <button
                type="button"
                className="shelf-arrow absolute left-0 top-[45%] z-50 -translate-y-1/2"
                onClick={() =>
                  setActiveIndex((current) => (current - 1 + languageEntries.length) % languageEntries.length)
                }
                aria-label="Previous language"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="shelf-arrow absolute right-0 top-[45%] z-50 -translate-y-1/2"
                onClick={() =>
                  setActiveIndex((current) => (current + 1) % languageEntries.length)
                }
                aria-label="Next language"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {viewState.level === "chapters" ? (
        <section className="relative overflow-hidden bg-ink text-paper" aria-label="Chapter shelf">
          <div className="grain absolute inset-0 opacity-40" aria-hidden="true" />

          <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-10">
            <button
              type="button"
              onClick={() => {
                setActiveIndex(0);
                setViewState({
                  level: "languages",
                  selectedLanguage: null,
                  selectedChapter: null,
                });
              }}
              className="mb-8 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-paper/45 transition-colors hover:text-accent"
            >
              ← Back to Shelf
            </button>

            <div
              className="mx-auto max-w-2xl text-center"
              style={{ "--disc-glow-color": accentColor }}
            >
              <div className="flex items-center justify-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em] text-paper/45">
                <span className="h-px w-8 bg-accent/70" aria-hidden="true" />
                CodeMentor / {viewState.selectedLanguage}
              </div>

              <h2 className="title-glowing mt-5 font-display text-[clamp(2.6rem,6vw,4.4rem)] leading-[0.9] tracking-[-0.04em]">
                {selectedLanguage?.name}{" "}
                <span className="italic text-accent">Chapters</span>
              </h2>

              <div className="my-8 flex flex-col items-center justify-center">
                <div className="cd-pop" key={viewState.selectedLanguage}>
                  <div className="turntable-stage">
                    <div className="turntable-tilt">
                      <div className="vinyl-disc turntable-spin h-[160px] w-[160px] sm:h-[190px] sm:w-[190px]">
                        <div className="vinyl-label">
                          <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                            {selectedLanguage?.name}
                          </span>
                          <span className="text-[7px] font-medium uppercase tracking-[0.18em]">
                            LP · vol. 01
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="mt-7 h-px w-64 bg-gradient-to-r from-transparent via-paper/25 to-transparent"
                  aria-hidden="true"
                />

                <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.2em] text-paper/45">
                  {selectedLanguage?.chapters.length} grooves on the{" "}
                  {selectedLanguage?.name} LP
                </p>
              </div>
            </div>

            <div className="cd-panel mx-auto mt-10 flex max-w-2xl flex-col gap-2">
              {chapterList.map((chapter, index) => (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => openChapter(chapter.id)}
                  className="group flex items-center gap-4 rounded-[3px] border border-paper/12 bg-[#121410] px-4 py-3 text-left transition-colors hover:border-accent/40 cd-groove-row"
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/35">
                    {pad(index + 1)}
                  </span>
                  <span className="font-display text-[15px] text-paper">
                    {chapter.title}
                  </span>
                  <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.16em] text-paper/40">
                    {chapter.challenges.length} track
                    {chapter.challenges.length === 1 ? "" : "s"}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-12 text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveIndex(0);
                  setViewState({
                    level: "languages",
                    selectedLanguage: null,
                    selectedChapter: null,
                  });
                }}
                className="rounded-full border border-paper/20 bg-ink px-6 py-3 font-mono text-[9px] uppercase tracking-[0.2em] text-paper/70 transition-colors hover:border-accent/60 hover:text-accent"
              >
                ⏏ Eject — Back to Shelf
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {viewState.level === "challenges" ? (
        <section className="relative overflow-hidden bg-ink text-paper" aria-label="Chapter tracklist">
          <div className="grain absolute inset-0 opacity-40" aria-hidden="true" />

          <div className="relative mx-auto max-w-3xl px-6 py-16 lg:px-10">
            <button
              type="button"
              onClick={() => {
                setActiveIndex(0);
                setViewState((previous) => ({
                  ...previous,
                  level: "chapters",
                  selectedChapter: null,
                }));
              }}
              className="mb-8 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-paper/45 transition-colors hover:text-accent"
            >
              ← Back to Chapters
            </button>

            {user?.progress?.calibratedLevel > 1 ? (
              <div className="mb-6 rounded-[3px] border border-accent/30 bg-accent/10 px-4 py-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
                  ⚡ Diagnostic Calibration: Levels 1–{user.progress.calibratedLevel - 1} bypassed
                  (+{user.progress.bonusXp || 0} XP bonus applied). Resuming at Level{" "}
                  {user.progress.calibratedLevel}.
                </p>
              </div>
            ) : null}

            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-paper/45">
              <span className="h-px w-8 bg-accent/70" aria-hidden="true" />
              CodeMentor / {viewState.selectedLanguage}
            </div>

            <h2 className="mt-4 font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-[0.95] tracking-[-0.04em]">
              {selectedChapter?.title}{" "}
              <span className="italic text-accent">
                {selectedLanguage?.name}
              </span>
            </h2>

            <div className="mt-10 flex flex-col gap-2 cd-panel">
              {chapterChallenges.map((challenge, index) => {
                const solved = solvedIds.includes(challenge.id);

                return (
                  <button
                    key={challenge.id}
                    type="button"
                    onClick={() => router.push(`/challenges/${challenge.id}/solve`)}
                    className="group flex items-center gap-4 rounded-[3px] border border-paper/12 bg-[#121410] px-4 py-3 text-left transition-colors hover:border-accent/40 cd-groove-row"
                  >
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/35">
                      {pad(index + 1)}
                    </span>
                    <DifficultyBadge difficulty={challenge.difficulty} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[15px] text-paper">
                        {challenge.title}
                      </span>
                      <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.16em] text-paper/40">
                        {challenge.language} · {challenge.estimatedMinutes} min
                      </span>
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-paper/40">
                      {solved ? "solved" : "open"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
