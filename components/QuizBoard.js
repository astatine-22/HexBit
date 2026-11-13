"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ArrowLeft, ArrowRight, Check } from "@/components/icons";
import quizzes from "@/data/quizzes.json";

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export default function QuizBoard() {
  const { user } = useAuth();
  const [mode, setMode] = useState("practice"); // practice | timed
  const [language, setLanguage] = useState("python");
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [finished, setFinished] = useState(false);

  const languages = useMemo(
    () => Array.from(new Set(quizzes.map((q) => q.language))),
    []
  );

  function startQuiz() {
    const pool = quizzes.filter((q) => q.language === language);
    const shuffled = shuffle(pool).slice(0, 8);
    setQuestions(shuffled);
    setIndex(0);
    setSelected([]);
    setSubmitted(false);
    setAnswers([]);
    setTimeLeft(120);
    setFinished(false);
    setStarted(true);
  }

  useEffect(() => {
    if (!started || finished || mode !== "timed") return;
    if (timeLeft <= 0) {
      setFinished(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [started, finished, mode, timeLeft]);

  const current = questions[index];

  function toggleOption(i) {
    if (submitted && mode === "practice") return;
    setSelected((prev) =>
      current.format === "mcq" || current.format === "boolean" || current.format === "predict-output" || current.format === "fix-bug" || current.format === "code-task"
        ? [i]
        : prev.includes(i)
          ? prev.filter((x) => x !== i)
          : [...prev, i]
    );
  }

  function submitAnswer() {
    if (selected.length === 0) return;
    const correct = JSON.stringify([...selected].sort()) === JSON.stringify([...current.answer].sort());
    setAnswers((prev) => [...prev, { question: current, selected: [...selected], correct }]);
    setSubmitted(true);
  }

  function nextQuestion() {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected([]);
    setSubmitted(false);
  }

  const score = answers.filter((a) => a.correct).length;
  const passed = questions.length > 0 && score / questions.length >= 0.6;

  if (!started) {
    return (
      <div className="space-y-6">
        <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
            Quiz engine
          </p>
          <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-[1] tracking-[-0.03em]">
            Test your <span className="italic text-accent">knowledge.</span>
          </h1>
          <p className="mt-2 text-[13px] text-paper/50">
            Practice mode gives instant feedback; timed mode shuffles and enforces a 60% pass threshold.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-full border border-paper/10 bg-ink-3 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-paper/70"
            >
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <div className="flex gap-1.5">
              {["practice", "timed"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
                    mode === m
                      ? "border-ink bg-accent text-ink"
                      : "border-paper/10 text-paper/60 hover:border-accent/40"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={startQuiz}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[12px] font-semibold text-ink"
          >
            Start quiz
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </section>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="space-y-6">
        <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
            Results
          </p>
          <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-[1] tracking-[-0.03em]">
            {passed ? "Passed!" : "Keep practicing."}
          </h1>
          <p className="mt-2 text-[13px] text-paper/50">
            {score} / {questions.length} correct ({Math.round((score / questions.length) * 100)}%)
          </p>

          <div className="mt-6 space-y-4">
            {answers.map((a, i) => (
              <div
                key={i}
                className={`rounded-[3px] border p-4 ${
                  a.correct ? "border-[#8fe0b7]/30 bg-[#8fe0b7]/5" : "border-[#ee917c]/30 bg-[#ee917c]/5"
                }`}
              >
                <p className="text-[13px] font-medium text-paper">{a.question.question}</p>
                <p className="mt-1 font-mono text-[9px] text-paper/50">
                  {a.correct ? "✓ Correct" : "✗ Incorrect"}
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-paper/60">
                  {a.question.explanation}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setStarted(false)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[12px] font-semibold text-ink"
          >
            Try again
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/40">
            Question {index + 1} / {questions.length}
          </p>
          {mode === "timed" ? (
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
              {timeLeft}s
            </p>
          ) : null}
        </div>

        {current.code ? (
          <pre className="mt-4 overflow-auto rounded-[3px] border border-paper/10 bg-ink-3 p-4 font-mono text-[12px] text-paper/80">
            {current.code}
          </pre>
        ) : null}

        <h2 className="mt-4 font-display text-[clamp(1.4rem,3vw,2rem)] leading-[1.1] tracking-[-0.02em]">
          {current.question}
        </h2>

        <div className="mt-5 space-y-2">
          {current.options.map((opt, i) => {
            const isSelected = selected.includes(i);
            const isCorrect = current.answer.includes(i);
            const showResult = submitted && mode === "practice";

            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleOption(i)}
                disabled={submitted && mode === "practice"}
                className={`flex w-full items-center gap-3 rounded-[3px] border px-4 py-3 text-left text-[13px] transition-colors ${
                  showResult
                    ? isCorrect
                      ? "border-[#8fe0b7]/40 bg-[#8fe0b7]/10 text-paper"
                      : isSelected
                        ? "border-[#ee917c]/40 bg-[#ee917c]/10 text-paper"
                        : "border-paper/10 text-paper/60"
                    : isSelected
                      ? "border-accent bg-accent/10 text-paper"
                      : "border-paper/10 text-paper/70 hover:border-accent/40"
                }`}
              >
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[9px] ${
                    isSelected ? "border-accent bg-accent text-ink" : "border-paper/30"
                  }`}
                >
                  {isSelected ? <Check className="h-2.5 w-2.5" /> : null}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {submitted && mode === "practice" ? (
          <div className="mt-5 rounded-[3px] border border-paper/10 bg-ink-3 p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
              Explanation
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-paper/60">
              {current.explanation}
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          {!submitted ? (
            <button
              type="button"
              onClick={submitAnswer}
              disabled={selected.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[12px] font-semibold text-ink disabled:opacity-40"
            >
              Submit
            </button>
          ) : (
            <button
              type="button"
              onClick={nextQuestion}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[12px] font-semibold text-ink"
            >
              {index + 1 >= questions.length ? "Finish" : "Next question"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
