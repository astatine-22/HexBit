"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { updateProgress } from "@/lib/auth";
import { LANGUAGE_META } from "@/lib/ui";
import quizzes from "@/data/quizzes.json";
import { Check, Sparkle, ArrowRight } from "@/components/icons";

const LANGUAGES = [
  { id: "python", name: "Python", glyph: "Py", blurb: "Clean, readable, versatile" },
  { id: "javascript", name: "JavaScript", glyph: "JS", blurb: "Web, fullstack, async" },
  { id: "typescript", name: "TypeScript", glyph: "TS", blurb: "Type-safe scalability" },
  { id: "go", name: "Go", glyph: "Go", blurb: "Concurrent, fast systems" },
  { id: "rust", name: "Rust", glyph: "Rs", blurb: "Memory-safe, high performance" },
  { id: "java", name: "Java", glyph: "Jv", blurb: "Enterprise OOP architecture" },
  { id: "cpp", name: "C++", glyph: "C++", blurb: "Low-level speed & control" },
  { id: "c", name: "C", glyph: "C", blurb: "Hardware foundations & memory" },
];

const LEVELS = [
  {
    id: "beginner",
    title: "The Apprentice",
    subtitle: "New to coding or building basics",
    detail: "Focus on loops, variables, and fundamentals",
  },
  {
    id: "intermediate",
    title: "The Practitioner",
    subtitle: "Comfortable with logic & idioms",
    detail: "Focus on data structures, slices, and patterns",
  },
  {
    id: "advanced",
    title: "The Specialist",
    subtitle: "Preparing for interviews & algorithms",
    detail: "Focus on Big-O optimization, recursion & rigor",
  },
];

const STYLES = [
  {
    id: "socratic",
    title: "The Socratic Nudge",
    desc: "Guides with conceptual clues. Never reveals the raw answer directly.",
  },
  {
    id: "direct",
    title: "The Co-Pilot",
    desc: "Pinpoints syntax and runtime bugs directly so you iterate fast.",
  },
  {
    id: "strict",
    title: "The Staff Engineer",
    desc: "Rigorous critique on Big-O, edge cases, and production idioms.",
  },
];

export default function OnboardingFlow() {
  const router = useRouter();
  const { user, reloadUser } = useAuth();

  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [selectedLevel, setSelectedLevel] = useState("beginner");
  const [selectedStyle, setSelectedStyle] = useState("socratic");

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Get questions for selected language (fallback to python if none)
  const languageQuestions = quizzes.filter((q) => q.language === selectedLanguage);
  const activeQuestions =
    languageQuestions.length > 0
      ? languageQuestions.slice(0, 3)
      : quizzes.filter((q) => q.language === "python").slice(0, 3);

  async function handleFinish() {
    let calibratedLevel = 1;
    let bonusXp = 50;
    if (selectedLevel === "advanced" && score === activeQuestions.length) {
      calibratedLevel = 21;
      bonusXp = 200;
    } else if (score >= 2) {
      calibratedLevel = 11;
      bonusXp = 120;
    }

    if (user?.username) {
      updateProgress(user.username, {
        favoriteLanguage: selectedLanguage,
        experienceLevel: selectedLevel,
        learningStyle: selectedStyle,
        hasCompletedOnboarding: true,
        calibratedLevel,
        diagnosticScore: score,
        bonusXp,
        xp: (user?.progress?.xp || 0) + bonusXp,
      });
      reloadUser?.();
    }
    router.push("/challenges");
  }

  function handleAnswerSelect(optIndex) {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(optIndex);
  }

  function handleCheckAnswer() {
    if (selectedAnswer === null || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    const q = activeQuestions[quizIndex];
    const isCorrect = Array.isArray(q.answer)
      ? q.answer.includes(selectedAnswer)
      : q.answer === selectedAnswer;
    if (isCorrect) {
      setScore((s) => s + 1);
    }
  }

  function handleNextQuestion() {
    if (quizIndex + 1 < activeQuestions.length) {
      setQuizIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      setStep(4); // Completed summary
    }
  }

  const currentQ = activeQuestions[quizIndex];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Progress Stepper */}
      <div className="mb-8 flex items-center justify-between border-b border-paper/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-accent/40 bg-accent/10 font-mono text-xs text-accent">
            0{step}
          </span>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-accent">
              The Soundcheck · Step {step} of 4
            </p>
            <h1 className="font-display text-lg text-paper/90 sm:text-xl">
              {step === 1 && "Select Your Primary Track"}
              {step === 2 && "Calibrate Level & Mentor Persona"}
              {step === 3 && "Quick Skill Calibration Quiz"}
              {step === 4 && "Track Calibrated & Ready"}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleFinish()}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/40 transition-colors hover:text-paper/80"
        >
          Skip for now →
        </button>
      </div>

      {/* STEP 1: Select Language */}
      {step === 1 && (
        <div className="space-y-6">
          <p className="text-sm text-paper/60">
            Choose the language you want CodeMentor to tailor for you. You can explore other languages at any time from the shelf.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {LANGUAGES.map((lang) => {
              const meta = LANGUAGE_META[lang.id] || {};
              const isSelected = selectedLanguage === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.id)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? "border-accent bg-accent/10 shadow-lg shadow-accent/5 ring-1 ring-accent"
                      : "border-paper/10 bg-ink-2/80 hover:border-paper/30 hover:bg-ink-2"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="font-mono text-xs font-bold"
                      style={{ color: meta.cover?.accent || "#d9f65a" }}
                    >
                      {lang.glyph}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-accent" />}
                  </div>
                  <div className="mt-4">
                    <p className="font-display text-base text-paper">{lang.name}</p>
                    <p className="mt-0.5 text-[11px] text-paper/50">{lang.blurb}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 font-mono text-xs font-semibold text-ink transition-transform hover:scale-[1.02]"
            >
              Continue to Calibration <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Level & Style */}
      {step === 2 && (
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-base text-paper sm:text-lg">
              1. What is your current coding level?
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {LEVELS.map((lvl) => {
                const isSelected = selectedLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setSelectedLevel(lvl.id)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10 ring-1 ring-accent"
                        : "border-paper/10 bg-ink-2/80 hover:border-paper/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-display text-sm font-semibold text-paper">
                        {lvl.title}
                      </p>
                      {isSelected && <Check className="h-3.5 w-3.5 text-accent" />}
                    </div>
                    <p className="mt-1 text-xs text-paper/70">{lvl.subtitle}</p>
                    <p className="mt-2 font-mono text-[10px] text-paper/40">
                      {lvl.detail}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="font-display text-base text-paper sm:text-lg">
              2. How should your AI Mentor assist you?
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {STYLES.map((st) => {
                const isSelected = selectedStyle === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.id)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10 ring-1 ring-accent"
                        : "border-paper/10 bg-ink-2/80 hover:border-paper/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-display text-sm font-semibold text-paper">
                        {st.title}
                      </p>
                      {isSelected && <Check className="h-3.5 w-3.5 text-accent" />}
                    </div>
                    <p className="mt-1 text-xs text-paper/60">{st.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="font-mono text-xs text-paper/50 hover:text-paper"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                setQuizIndex(0);
                setSelectedAnswer(null);
                setIsAnswerSubmitted(false);
                setStep(3);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 font-mono text-xs font-semibold text-ink transition-transform hover:scale-[1.02]"
            >
              Start Diagnostic Quiz <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Diagnostic Quiz */}
      {step === 3 && currentQ && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-accent">
              Question {quizIndex + 1} of {activeQuestions.length} · {currentQ.topic}
            </span>
            <span className="font-mono text-xs text-paper/40">
              Target: {selectedLanguage.toUpperCase()}
            </span>
          </div>

          <div className="rounded-2xl border border-paper/10 bg-ink-2 p-6 shadow-xl">
            <h3 className="text-base font-medium text-paper sm:text-lg">
              {currentQ.question}
            </h3>

            {currentQ.code && (
              <pre className="my-4 rounded-lg border border-paper/10 bg-black/40 p-4 font-mono text-xs text-[#d9f65a] overflow-x-auto">
                <code>{currentQ.code}</code>
              </pre>
            )}

            <div className="mt-5 space-y-2.5">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = selectedAnswer === optIdx;
                const isCorrect = Array.isArray(currentQ.answer)
                  ? currentQ.answer.includes(optIdx)
                  : currentQ.answer === optIdx;

                let stateClasses = "border-paper/10 bg-white/[0.02] hover:bg-white/[0.05]";
                if (isSelected && !isAnswerSubmitted) {
                  stateClasses = "border-accent bg-accent/15 ring-1 ring-accent text-accent";
                } else if (isAnswerSubmitted) {
                  if (isCorrect) {
                    stateClasses = "border-[#4da97b] bg-[#4da97b]/15 text-[#7bddaa]";
                  } else if (isSelected && !isCorrect) {
                    stateClasses = "border-[#bf5741] bg-[#bf5741]/15 text-[#ee917c]";
                  }
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleAnswerSelect(optIdx)}
                    disabled={isAnswerSubmitted}
                    className={`w-full rounded-xl border p-3.5 text-left font-mono text-xs transition-all ${stateClasses}`}
                  >
                    <span className="mr-3 inline-block w-4 text-paper/30">
                      {String.fromCharCode(65 + optIdx)}.
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Explanation box after submit */}
            {isAnswerSubmitted && (
              <div className="mt-5 rounded-xl border border-paper/10 bg-ink-3/80 p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                  Why this is correct:
                </p>
                <p className="mt-1 text-xs text-paper/80 leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => handleFinish(50)}
              className="font-mono text-xs text-paper/40 hover:text-paper/70"
            >
              Skip rest of quiz →
            </button>

            {!isAnswerSubmitted ? (
              <button
                type="button"
                onClick={handleCheckAnswer}
                disabled={selectedAnswer === null}
                className="rounded-full bg-accent px-6 py-2 font-mono text-xs font-semibold text-ink disabled:opacity-40"
              >
                Submit Answer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2 font-mono text-xs font-semibold text-ink"
              >
                {quizIndex + 1 < activeQuestions.length ? "Next Question" : "Complete Calibration"}{" "}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: Calibration Complete */}
      {step === 4 && (
        <div className="rounded-2xl border border-accent/30 bg-ink-2 p-8 text-center shadow-2xl">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent/20 text-accent">
            <Sparkle className="h-6 w-6" />
          </div>

          <h2 className="mt-4 font-display text-2xl text-paper">
            Calibration Complete!
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-paper/70 leading-relaxed">
            Your CodeMentor track has been personalized for{" "}
            <span className="font-semibold text-accent capitalize">{selectedLanguage}</span>{" "}
            with a{" "}
            <span className="font-semibold text-paper capitalize">{selectedStyle}</span> AI mentor.
          </p>

          <div className="mx-auto my-6 grid max-w-sm grid-cols-2 gap-4 rounded-xl border border-paper/10 bg-ink-3 p-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-paper/40">
                Diagnostic Score
              </p>
              <p className="mt-1 font-display text-2xl text-accent">
                {score} / {activeQuestions.length}
              </p>
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-paper/40">
                Bonus Starting XP
              </p>
              <p className="mt-1 font-display text-2xl text-[#7bddaa]">
                +{selectedLevel === "advanced" && score === activeQuestions.length ? 200 : score >= 2 ? 120 : 50} XP
              </p>
            </div>
            <div className="col-span-2">
              <p className="font-mono text-[9px] uppercase tracking-widest text-paper/40">
                Calibrated Level
              </p>
              <p className="mt-1 font-display text-2xl text-accent">
                {selectedLevel === "advanced" && score === activeQuestions.length ? 21 : score >= 2 ? 11 : 1}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleFinish()}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3 font-mono text-sm font-semibold text-ink shadow-lg shadow-accent/20 transition-transform hover:scale-105"
          >
            Launch Your Personalized Track <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
