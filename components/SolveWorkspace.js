"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DifficultyBadge from "@/components/DifficultyBadge";
import GuestBanner from "@/components/GuestBanner";
import MentorPanel from "@/components/MentorPanel";
import UserMenu from "@/components/UserMenu";
import { ArrowLeft, Check, Play } from "@/components/icons";
import { runCode } from "@/lib/executor";
import {
  requestHint,
  getSolutionSummary,
  explainError,
  suggestNextChallenge,
} from "@/lib/mentor";
import {
  getAttemptCount,
  getSolvedChallengeIds,
  markChallengeSolved,
  recordAttempt,
  recordHintRequest,
} from "@/lib/progress";
import { isAudioSupported, playLinerNotes, stopLinerNotes } from "@/lib/audio";
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

function copyToClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return Promise.resolve();
}

export default function SolveWorkspace({ challenge }) {
  const language = getLanguage(challenge.language);
  const [code, setCode] = useState(challenge.starterCode);
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [runMatched, setRunMatched] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [summary, setSummary] = useState(null);
  const [next, setNext] = useState(null);
  const [linerState, setLinerState] = useState("idle");
  const [linerText, setLinerText] = useState(null);
  const [linerError, setLinerError] = useState("");
  const hintRequestCount = useRef(0);
  const editorRef = useRef(null);
  const shellRef = useRef(null);
  const menuRef = useRef(null);
  const copyTimer = useRef(null);
  const noticeTimer = useRef(null);
  const [floatingMenu, setFloatingMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    above: true,
    selectedText: "",
    range: null,
  });
  const [copied, setCopied] = useState(false);
  const [assistBusy, setAssistBusy] = useState(null);
  const [assistNotice, setAssistNotice] = useState("");
  const [incomingMentorMessage, setIncomingMentorMessage] = useState(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (menuRef.current && menuRef.current.contains(event.target)) {
        return;
      }
      setFloatingMenu((previous) =>
        previous.visible ? { ...previous, visible: false } : previous
      );
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      stopLinerNotes();
    };
  }, []);

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

  function handleEditorDidMount(editor) {
    editorRef.current = editor;

    editor.onDidChangeCursorSelection(() => {
      setCopied(false);
      positionFloatingMenu(editor);
    });

    editor.onDidScrollChange(() => {
      positionFloatingMenu(editor);
    });
  }

  function positionFloatingMenu(editor) {
    if (!editor) {
      return;
    }

    const selection = editor.getSelection();
    if (!selection || selection.isEmpty()) {
      setFloatingMenu((previous) => ({ ...previous, visible: false }));
      return;
    }

    const model = editor.getModel();
    const selectedText = model ? model.getValueInRange(selection).trim() : "";
    if (!selectedText) {
      setFloatingMenu((previous) => ({ ...previous, visible: false }));
      return;
    }

    const coordinates = editor.getScrolledVisiblePosition(selection.getStartPosition());
    if (!coordinates) {
      setFloatingMenu((previous) => ({ ...previous, visible: false }));
      return;
    }

    const endCoordinates = editor.getScrolledVisiblePosition(selection.getEndPosition());
    const shellWidth = shellRef.current?.clientWidth ?? 0;
    const shellHeight = shellRef.current?.clientHeight ?? 0;

    if (coordinates.top < -EDITOR_OPTIONS.lineHeight || (shellHeight && coordinates.top > shellHeight)) {
      setFloatingMenu((previous) => ({ ...previous, visible: false }));
      return;
    }

    const menuWidth = Math.min(500, Math.max(shellWidth - 16, 0));
    const maxLeft = shellWidth ? Math.max(8, shellWidth - menuWidth - 8) : coordinates.left;
    const left = shellWidth
      ? Math.min(Math.max(coordinates.left, 8), maxLeft)
      : coordinates.left;
    const above = coordinates.top > 52;

    setFloatingMenu({
      visible: true,
      x: left,
      y: above
        ? coordinates.top - 8
        : (endCoordinates ?? coordinates).top + EDITOR_OPTIONS.lineHeight + 8,
      above,
      selectedText,
      range: selection,
    });
  }

  function hideFloatingMenu() {
    setFloatingMenu((previous) => ({ ...previous, visible: false }));
  }

  function showAssistNotice(message) {
    setAssistNotice(message);
    if (noticeTimer.current) {
      window.clearTimeout(noticeTimer.current);
    }
    noticeTimer.current = window.setTimeout(() => setAssistNotice(""), 4000);
  }

  async function handleCopySelection() {
    if (!floatingMenu.selectedText) {
      return;
    }

    try {
      await copyToClipboard(floatingMenu.selectedText);
      setCopied(true);
      if (copyTimer.current) {
        window.clearTimeout(copyTimer.current);
      }
      copyTimer.current = window.setTimeout(() => setCopied(false), 1400);
    } catch {
      showAssistNotice("Could not copy — your browser blocked clipboard access.");
    }
  }

  function handleAddToChat() {
    if (!floatingMenu.selectedText) {
      return;
    }

    setIncomingMentorMessage({
      id: Date.now(),
      kind: "snippet",
      snippet: floatingMenu.selectedText,
    });
    hideFloatingMenu();
  }

  async function handleExplainSection() {
    const snippet = floatingMenu.selectedText;
    if (!snippet || assistBusy) {
      return;
    }

    setAssistBusy("explain");

    try {
      const res = await fetch("/api/explain-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          challengeDescription: challenge.description,
          code: snippet,
          language: challenge.language,
          action: "explain_snippet",
        }),
      });
      const data = await res.json();

      if (!res.ok || !data?.explanation) {
        throw new Error(data?.error || "The AI did not return an explanation.");
      }

      setIncomingMentorMessage({
        id: Date.now(),
        kind: "explain",
        text: data.explanation,
        snippet,
      });
    } catch (error) {
      showAssistNotice(error.message || "Couldn't explain that snippet. Try again.");
    } finally {
      setAssistBusy(null);
      hideFloatingMenu();
    }
  }

  async function handleCompleteCode() {
    const snippet = floatingMenu.selectedText;
    if (!snippet || assistBusy) {
      return;
    }

    /* -------------------------------------------------------------------------
     * POINT PENALTY SYSTEM (RESERVED FOR FUTURE SCORING RELEASE)
     * -------------------------------------------------------------------------
     * Uncomment the lines below once student points/leaderboard are active:
     *
     * const POINT_COST_COMPLETE = 20;
     * deductUserPoints({
     *   userId: getAnonymousUserId(),
     *   challengeId: challenge.id,
     *   deduction: POINT_COST_COMPLETE,
     *   reason: "Used AI snippet completion"
     * });
     * showNotification(`- ${POINT_COST_COMPLETE} points for AI auto-completion`);
     * ------------------------------------------------------------------------- */

    setAssistBusy("complete");

    try {
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          challengeDescription: challenge.description,
          userCode: code,
          snippet,
          language: challenge.language,
          action: "complete_snippet",
        }),
      });
      const data = await res.json();

      if (!res.ok || !data?.completedSnippet) {
        throw new Error(data?.error || "The AI did not return a completion.");
      }

      const editor = editorRef.current;
      const range = floatingMenu.range;
      if (!editor || !range) {
        throw new Error("The editor is not ready — reselect the snippet and try again.");
      }

      editor.pushUndoStop();
      editor.executeEdits("ai-assist", [
        {
          range,
          text: data.completedSnippet,
          forceMoveMarkers: true,
        },
      ]);
      editor.pushUndoStop();
      editor.setPosition(range.getStartPosition());
      setCode(editor.getValue());
    } catch (error) {
      showAssistNotice(error.message || "Couldn't complete that snippet. Try again.");
    } finally {
      setAssistBusy(null);
      hideFloatingMenu();
    }
  }

  async function handleCorrectCode() {
    const snippet = floatingMenu.selectedText;
    if (!snippet || assistBusy) {
      return;
    }

    /* -------------------------------------------------------------------------
     * POINT PENALTY SYSTEM (RESERVED FOR FUTURE SCORING RELEASE)
     * -------------------------------------------------------------------------
     * Uncomment the lines below once student points/leaderboard are active:
     *
     * const POINT_COST_CORRECT = 15;
     * deductUserPoints({
     *   userId: getAnonymousUserId(),
     *   challengeId: challenge.id,
     *   deduction: POINT_COST_CORRECT,
     *   reason: "Used AI bug correction"
     * });
     * showNotification(`- ${POINT_COST_CORRECT} points for AI bug correction`);
     * ------------------------------------------------------------------------- */

    setAssistBusy("correct");

    try {
      const res = await fetch("/api/explain-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          challengeDescription: challenge.description,
          code: snippet,
          language: challenge.language,
          fixRequested: true,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data?.correctedSnippet) {
        throw new Error(data?.error || "The AI did not return a correction.");
      }

      const editor = editorRef.current;
      const range = floatingMenu.range;
      if (!editor || !range) {
        throw new Error("The editor is not ready — reselect the snippet and try again.");
      }

      editor.pushUndoStop();
      editor.executeEdits("ai-assist", [
        {
          range,
          text: data.correctedSnippet,
          forceMoveMarkers: true,
        },
      ]);
      editor.pushUndoStop();
      editor.setPosition(range.getStartPosition());
      setCode(editor.getValue());
    } catch (error) {
      showAssistNotice(error.message || "Couldn't correct that snippet. Try again.");
    } finally {
      setAssistBusy(null);
      hideFloatingMenu();
    }
  }

  async function handleRun() {
    if (running) {
      return;
    }

    setRunning(true);

    try {
      // Live backend execution via /api/run + /api/check.
      const result = await runCode(challenge.language, code, challenge);
      setOutput(result);
      setAttempts((current) => current + 1);

      const matches =
        result.success &&
        normalize(result.stdout).length > 0 &&
        normalize(result.stdout) === normalize(challenge.expectedOutput);

      setRunMatched(matches);

      if (matches) {
        setSolved(true);
        markChallengeSolved(challenge.id, attempts + 1);

        try {
          const summaryData = await getSolutionSummary({
            challengeId: challenge.id,
            code,
            language: challenge.language,
          });
          setSummary(summaryData?.summary ?? null);
        } catch {
          setSummary(null);
        }
      } else {
        recordAttempt({
          challengeId: challenge.id,
          passed: false,
          attemptCount: attempts + 1,
        });
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

  async function handleExplainError() {
    if (!stderr) {
      return;
    }

    try {
      const data = await explainError({
        challengeId: challenge.id,
        code,
        language: challenge.language,
        error: stderr,
      });
      setExplanation(data?.explanation ?? stderr);
    } catch {
      setExplanation(stderr);
    }
  }

  async function handleNextChallenge() {
    try {
      const data = await suggestNextChallenge({ solvedIds: [challenge.id] });
      setNext(data);
    } catch {
      // recommendation is optional — ignore failures
    }
  }

  async function handleLinerNotes() {
    if (linerState === "playing") {
      stopLinerNotes();
      setLinerState("idle");
      return;
    }

    if (linerState === "loading") return;

    setLinerState("loading");
    setLinerError("");

    try {
      const res = await fetch("/api/liner-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: challenge.title,
          language: challenge.language,
          description: challenge.description,
          category: challenge.category,
        }),
      });
      const data = await res.json();
      const text = typeof data?.text === "string" && data.text.trim() ? data.text.trim() : "";

      if (!text) {
        throw new Error("No liner notes returned.");
      }

      setLinerText(text);

      const started = playLinerNotes(text, {
        onStart: () => setLinerState("playing"),
        onEnd: () => setLinerState("idle"),
        onError: () => {
          setLinerState("idle");
          // Keep linerText visible; only note that audio output was muted/unsupported
          setLinerError("Spoken audio was blocked or unavailable on this device. Showing text below:");
        },
      });

      if (!started) {
        setLinerState("idle");
        setLinerError("Speech synthesis is not supported on this device. Showing text below:");
      }
    } catch (error) {
      setLinerState("idle");
      setLinerError(error?.message || "Could not load liner notes.");
    }
  }
  async function handleRequestHint({ snippet } = {}) {
    // TODO: replace with real API call to /api/hint
    const hint = await requestHint({
      challengeId: challenge.id,
      userCode: snippet || code,
      errorMessage: snippet ? "" : output?.stderr || "",
      attemptCount: attempts + hintRequestCount.current,
    });

    hintRequestCount.current += 1;
    recordHintRequest(challenge.id);
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

          <button
            type="button"
            onClick={handleLinerNotes}
            disabled={linerState === "loading"}
            title="Spoken audio intuition"
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.16em] transition-colors ${
              linerState === "playing"
                ? "border-accent text-accent bg-accent/10"
                : linerState === "loading"
                  ? "border-paper/20 text-paper/40"
                  : "border-paper/20 text-paper/70 hover:border-accent/50 hover:text-accent"
            }`}
          >
            {linerState === "loading" ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-paper/20 border-t-accent" />
            ) : linerState === "playing" ? (
              <span className="flex items-end gap-0.5" aria-hidden="true">
                <span className="h-2 w-0.5 animate-pulse bg-accent" />
                <span className="h-3 w-0.5 animate-pulse bg-accent [animation-delay:120ms]" />
                <span className="h-2.5 w-0.5 animate-pulse bg-accent [animation-delay:240ms]" />
              </span>
            ) : (
              <span aria-hidden="true">♪</span>
            )}
            {linerState === "playing" ? "Stop" : "Liner Notes"}
            {linerState === "idle" ? (
              <span className="text-paper/30">(&gt; Audio)</span>
            ) : null}
          </button>

          <Link
            href="/challenges"
            className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-paper/35 transition-colors hover:text-paper/70 md:inline"
          >
            Shelf
          </Link>

          <UserMenu />
        </div>
      </header>

      {linerText || linerError ? (
        <div className="border-b border-paper/10 bg-ink-2/80 px-4 py-2.5 backdrop-blur lg:px-6">
          <div className="mx-auto flex max-w-7xl items-start gap-3">
            <span className="mt-0.5 shrink-0 font-mono text-[8px] uppercase tracking-[0.2em] text-accent">
              Liner notes
            </span>
            <div className="flex-1 space-y-1">
              {linerError && !linerText ? (
                <p className="text-[12px] leading-relaxed text-[#ee917c]">{linerError}</p>
              ) : null}
              {linerText ? (
                <p className="text-[12px] leading-relaxed text-paper/85 font-mono">
                  &ldquo;{linerText}&rdquo;
                </p>
              ) : null}
              {linerError && linerText ? (
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-paper/40">
                  {linerError}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <GuestBanner />

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

            <div
              ref={shellRef}
              className="monaco-shell relative h-[440px] min-h-0 w-full lg:h-auto lg:flex-1"
            >
              <MonacoEditor
                height="100%"
                language={language.monaco}
                value={code}
                onChange={(value) => setCode(value ?? "")}
                beforeMount={handleEditorWillMount}
                onMount={handleEditorDidMount}
                theme="codementor"
                options={EDITOR_OPTIONS}
              />

              {floatingMenu.visible ? (
                <div
                  ref={menuRef}
                  role="toolbar"
                  aria-label="Code assist actions"
                  className="code-assist-pop absolute z-50 flex max-w-full flex-wrap items-center gap-1 rounded-full border border-paper/20 bg-ink/95 px-2 py-1 shadow-2xl backdrop-blur-md"
                  style={{
                    left: `${floatingMenu.x}px`,
                    top: `${floatingMenu.y}px`,
                    transform: floatingMenu.above ? "translateY(-100%)" : "none",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleAddToChat}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] text-paper/80 transition-colors hover:bg-paper/10 hover:text-accent"
                    title="Discuss this snippet with Mentor"
                  >
                    <span>💬</span> Ask Expert
                  </button>

                  <span className="h-3 w-px bg-paper/15" aria-hidden="true" />

                  <button
                    type="button"
                    onClick={handleExplainSection}
                    disabled={assistBusy !== null}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] text-paper/80 transition-colors hover:bg-paper/10 hover:text-accent disabled:cursor-wait disabled:opacity-50"
                    title="Explain what this snippet does"
                  >
                    <span>🔍</span> {assistBusy === "explain" ? "Explaining…" : "Explain"}
                  </button>

                  <span className="h-3 w-px bg-paper/15" aria-hidden="true" />

                  <button
                    type="button"
                    onClick={handleCopySelection}
                    className="flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[11px] text-paper/60 transition-colors hover:bg-paper/10 hover:text-paper"
                    title="Copy to clipboard"
                  >
                    <span>{copied ? "✓" : "📋"}</span>{" "}
                    {copied ? "Copied" : "Copy"}
                  </button>

                  <span className="h-3 w-px bg-paper/15" aria-hidden="true" />

                  <button
                    type="button"
                    onClick={handleCompleteCode}
                    disabled={assistBusy !== null}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] text-paper/80 transition-colors hover:bg-paper/10 hover:text-[#7bddaa] disabled:cursor-wait disabled:opacity-50"
                    title="Complete this logic with AI"
                  >
                    <span>✨</span>{" "}
                    {assistBusy === "complete" ? "Completing…" : "Complete"}
                  </button>

                  <span className="h-3 w-px bg-paper/15" aria-hidden="true" />

                  <button
                    type="button"
                    onClick={handleCorrectCode}
                    disabled={assistBusy !== null}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] text-paper/80 transition-colors hover:bg-paper/10 hover:text-[#ee917c] disabled:cursor-wait disabled:opacity-50"
                    title="Fix bugs in this snippet"
                  >
                    <span>🛠️</span>{" "}
                    {assistBusy === "correct" ? "Fixing…" : "Correct"}
                  </button>
                </div>
              ) : null}

              {assistNotice ? (
                <div
                  role="status"
                  className="absolute bottom-3 left-1/2 z-40 max-w-[calc(100%-24px)] -translate-x-1/2 rounded-full border border-[#ee917c]/30 bg-[#1a1210]/95 px-3 py-1.5 text-center font-mono text-[10px] leading-snug text-[#ee917c] shadow-xl backdrop-blur"
                >
                  {assistNotice}
                </div>
              ) : null}
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

                    {stderr ? (
                      <button
                        type="button"
                        onClick={handleExplainError}
                        className="self-start rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-accent transition-opacity hover:opacity-90"
                      >
                        Explain error with AI
                      </button>
                    ) : null}

                    {explanation ? (
                      <pre className="whitespace-pre-wrap break-words rounded-[3px] border border-paper/12 bg-[#121410] p-3 font-mono text-[11px] leading-relaxed text-paper/70">
                        {explanation}
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

                    {solved && summary ? (
                      <p className="border-t border-paper/10 pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8fe0b7]">
                        Mentor summary · {summary}
                      </p>
                    ) : null}

                    {solved ? (
                      <button
                        type="button"
                        onClick={handleNextChallenge}
                        className="border-t border-paper/10 pt-3 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[12px] font-semibold text-ink transition-opacity hover:opacity-90"
                      >
                        Next Recommended Challenge
                      </button>
                    ) : null}
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
                incomingMessage={incomingMentorMessage}
                onMessageConsumed={() => setIncomingMentorMessage(null)}
              />
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .code-assist-pop {
          animation: code-assist-pop 140ms ease-out both;
        }

        @keyframes code-assist-pop {
          from {
            opacity: 0;
            translate: 0 4px;
          }
          to {
            opacity: 1;
            translate: 0 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .code-assist-pop {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}