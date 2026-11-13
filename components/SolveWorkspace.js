"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DifficultyBadge from "@/components/DifficultyBadge";
import MentorPanel from "@/components/MentorPanel";
import { ArrowLeft, Check, Play } from "@/components/icons";
import { runCode } from "@/lib/executor";
import { requestHint } from "@/lib/mentor";
import { getSolvedChallengeIds, markChallengeSolved } from "@/lib/progress";
import { getLanguage } from "@/lib/ui";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#101113] font-mono text-[10px] uppercase tracking-[0.2em] text-paper/30">
      Loading editor…
    </div>
  ),
});

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontFamily:
    "'JetBrains Mono', 'SFMono-Regular', 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  fontLigatures: true,
  fontSize: 13.5,
  lineHeight: 23,
  padding: { top: 18, bottom: 24 },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  wordWrap: "on",
  tabSize: 2,
  renderLineHighlight: "all",
  cursorBlinking: "smooth",
  smoothScrolling: true,
  glyphMargin: false,
  lineNumbersMinChars: 3,
  scrollbar: {
    verticalScrollbarSize: 9,
    horizontalScrollbarSize: 9,
  },
};

function normalize(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
}

export default function SolveWorkspace({ challenge }) {
  const language = getLanguage(challenge.language);
  const [code, setCode] = useState(challenge.starterCode);
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [runMatched, setRunMatched] = useState(false);
  const hintRequestCount = useRef(0);

  useEffect(() => {
    setSolved(getSolvedChallengeIds().includes(challenge.id));
  }, [challenge.id]);

  function handleEditorWillMount(monaco) {
    monaco.editor.defineTheme("codementor", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6f7768", fontStyle: "italic" },
        { token: "string", foreground: "d7dd8f" },
        { token: "number", foreground: "9cc9e6" },
        { token: "keyword", foreground: "e6bd77" },
        { token: "type", foreground: "c7b7e8" },
        { token: "type.identifier", foreground: "c7b7e8" },
        { token: "identifier", foreground: "e8e5da" },
        { token: "delimiter", foreground: "8d9082" },
      ],
      colors: {
        "editor.background": "#101113",
        "editor.foreground": "#e8e5da",
        "editorLineNumber.foreground": "#4a4e44",
        "editorLineNumber.activeForeground": "#c9c5b8",
        "editorCursor.foreground": "#d9f65a",
        "editor.selectionBackground": "#2c331f",
        "editor.inactiveSelectionBackground": "#23261d",
        "editor.lineHighlightBackground": "#15171a",
        "editorIndentGuide.background1": "#23261f",
        "editorIndentGuide.activeBackground1": "#3a3f32",
        "editorWidget.background": "#15170f",
        "editorWidget.border": "#2d2f26",
      },
    });
  }

  async function handleRun() {
    if (running) {
      return;
    }

    setRunning(true);

    try {
      // TODO: executor.js will swap this mock for a Piston-backed API route.
      const result = await runCode(challenge.language, code);
      setOutput(result);
      setAttempts((current) => current + 1);

      const matches =
        result.success &&
        normalize(result.stdout).length > 0 &&
        normalize(result.stdout) === normalize(challenge.expectedOutput);

      setRunMatched(matches);

      if (matches) {
        setSolved(true);
        markChallengeSolved(challenge.id);
      }
    } catch {
      setOutput({
        stdout: "",
        stderr: "The mock runtime did not respond. Try running again.",
        success: false,
        mocked: true,
      });
      setRunMatched(false);
      setAttempts((current) => current + 1);
    } finally {
      setRunning(false);
    }
  }

  async function handleRequestHint() {
    // TODO: replace with real API call to /api/hint
    const hint = await requestHint({
      challengeId: challenge.id,
      userCode: code,
      errorMessage: output?.stderr || "",
      attemptCount: attempts + hintRequestCount.current,
    });

    hintRequestCount.current += 1;
    return hint;
  }

  const lineCount = code.split("\n").length;
  const stdout = output?.stdout ?? "";
  const stderr = output?.stderr ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-[#0c0d0b] text-paper">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-paper/10 bg-[#0c0d0b]/95 px-4 backdrop-blur lg:h-16 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/challenges/${challenge.id}`}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-paper/15 text-paper/60 transition-colors hover:border-paper/35 hover:text-paper"
            aria-label="Back to challenge detail"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <span
            className="hidden h-5 w-px bg-paper/10 sm:block"
            aria-hidden="true"
          />

          <div className="min-w-0">
            <p className="truncate font-mono text-[8px] uppercase tracking-[0.24em] text-paper/35">
              CodeMentor / workspace
            </p>
            <p className="truncate font-display text-[15px] leading-tight tracking-[-0.01em] text-paper/90">
              {challenge.title}
            </p>
          </div>

          <span className="ml-1 hidden shrink-0 sm:block">
            <DifficultyBadge difficulty={challenge.difficulty} tone="dark" />
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.16em] transition-colors ${
              solved
                ? "border-[#8fe0b7]/30 bg-[#8fe0b7]/10 text-[#8fe0b7]"
                : "border-paper/12 text-paper/40"
            }`}
            aria-live="polite"
          >
            <span
              className={`grid h-3.5 w-3.5 place-items-center rounded-full border transition-all ${
                solved
                  ? "border-[#8fe0b7] bg-[#8fe0b7] text-ink"
                  : "border-paper/25"
              }`}
            >
              {solved ? <Check className="h-2.5 w-2.5" /> : null}
            </span>
            {solved ? "Solved" : "In progress"}
          </span>

          <Link
            href="/challenges"
            className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-paper/35 transition-colors hover:text-paper/70 md:inline"
          >
            Shelf
          </Link>
        </div>
      </header>

      <main className="flex-1 px-3 py-3 sm:px-4 lg:px-5 lg:py-4">
        <div className="grid min-h-0 gap-3 lg:h-[calc(100dvh-104px)] lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] lg:gap-4">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-[5px] border border-paper/12 bg-[#101113]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper/10 px-3 py-2.5 sm:px-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex shrink-0 gap-1.5" aria-hidden="true">
                  <span className="h-2 w-2 rounded-full bg-[#3a3d33]" />
                  <span className="h-2 w-2 rounded-full bg-[#3a3d33]" />
                  <span className="h-2 w-2 rounded-full bg-[#3a3d33]" />
                </span>
                <span className="truncate font-mono text-[11px] text-paper/55">
                  solution.{language.ext}
                </span>
                <span className="hidden shrink-0 rounded-[3px] border border-paper/12 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-paper/40 sm:inline">
                  {language.label}
                </span>
              </div>

              <button
                type="button"
                onClick={handleRun}
                disabled={running}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[12px] font-semibold text-ink transition-all hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              >
                <Play className="h-3 w-3" />
                {running ? "Running…" : "Run Code"}
              </button>
            </div>

            <div className="monaco-shell relative h-[440px] min-h-0 w-full lg:h-auto lg:flex-1">
              <MonacoEditor
                height="100%"
                language={language.monaco}
                value={code}
                onChange={(value) => setCode(value ?? "")}
                beforeMount={handleEditorWillMount}
                theme="codementor"
                options={EDITOR_OPTIONS}
              />
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-paper/10 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.16em] text-paper/30 sm:px-4">
              <span>
                {language.label} · {lineCount} lines
              </span>
              <span>{running ? "Mock run in flight…" : `Attempt ${attempts}`}</span>
            </div>
          </section>

          <div className="flex min-h-0 flex-col gap-3">
            <section className="flex min-h-[236px] flex-[0.92] flex-col overflow-hidden rounded-[4px] border border-paper/12 bg-[#121410]">
              <div className="flex items-center justify-between gap-3 border-b border-paper/10 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      running ? "animate-pulse bg-accent" : "bg-paper/25"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-paper/55">
                    Console
                  </span>
                </div>
                <span className="rounded-full border border-paper/12 px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.16em] text-paper/35">
                  mock engine
                </span>
              </div>

              <div
                className="code-scroll min-h-0 flex-1 overflow-auto p-4 font-mono text-[12px] leading-relaxed"
                aria-live="polite"
              >
                {running ? (
                  <div className="flex items-center gap-2.5 text-paper/40">
                    <span className="h-3 w-3 animate-spin rounded-full border border-paper/20 border-t-accent" />
                    Running {language.label}…
                  </div>
                ) : !output ? (
                  <p className="text-paper/30">
                    Run your code to see mocked output here.
                    <br />
                    <span className="text-paper/20">
                      Prints become stdout; errors become stderr.
                    </span>
                  </p>
                ) : (
                  <div className="space-y-3">
                    {stdout ? (
                      <pre className="whitespace-pre-wrap break-words text-[#d9e3c8]">
                        {stdout}
                      </pre>
                    ) : null}

                    {stderr ? (
                      <pre className="whitespace-pre-wrap break-words rounded-[3px] border border-[#bf5741]/25 bg-[#bf5741]/10 p-3 text-[#ee917c]">
                        {stderr}
                      </pre>
                    ) : null}

                    {!stdout && !stderr ? (
                      <p className="text-paper/35">
                        Program finished with no printable output. The mock
                        engine only reads string and number literals passed to
                        print-style calls.
                      </p>
                    ) : null}

                    {solved && runMatched ? (
                      <p className="flex items-center gap-2 border-t border-paper/10 pt-3 text-[10px] uppercase tracking-[0.14em] text-[#8fe0b7]">
                        <Check className="h-3.5 w-3.5" />
                        Output matches — pressing marked solved.
                      </p>
                    ) : solved ? (
                      <p className="flex items-center gap-2 border-t border-paper/10 pt-3 text-[10px] uppercase tracking-[0.14em] text-paper/40">
                        <Check className="h-3.5 w-3.5 text-[#8fe0b7]" />
                        Pressing already solved — keep refining if you like.
                      </p>
                    ) : (
                      <p className="border-t border-paper/10 pt-3 text-[10px] uppercase tracking-[0.14em] text-paper/30">
                        Mock run complete · compare with expected output
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 border-t border-paper/10 px-4 py-3">
                <span className="mt-0.5 shrink-0 font-mono text-[8px] uppercase tracking-[0.18em] text-paper/30">
                  Expected
                </span>
                <pre className="code-scroll max-h-20 min-w-0 flex-1 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-paper/55">
                  {challenge.expectedOutput}
                </pre>
              </div>
            </section>

            <div className="min-h-[300px] flex-[1.08] lg:min-h-0">
              <MentorPanel
                challengeId={challenge.id}
                userCode={code}
                errorMessage={stderr}
                attemptCount={attempts}
                onRequestHint={handleRequestHint}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}