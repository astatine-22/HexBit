"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Sparkle } from "@/components/icons";
import { checkApproach } from "@/lib/mentor";

/**
 * MentorPanel is the AI integration surface.
 *
 * Props are intentionally stable so this component can keep its UI while the
 * implementation moves from mock hints to a real backend:
 *
 *   MentorPanel({ challengeId, userCode, errorMessage, attemptCount, onRequestHint })
 *
 * `onRequestHint` is wired by the workspace to lib/mentor.js requestHint().
 * TODO: replace with real API call to /api/hint
 */
export default function MentorPanel({
  challengeId,
  userCode,
  errorMessage,
  attemptCount,
  onRequestHint,
  incomingMessage,
  onMessageConsumed,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hints, setHints] = useState([]);
  const [approach, setApproach] = useState("");
  const [approachFeedback, setApproachFeedback] = useState(null);
  const [checkingApproach, setCheckingApproach] = useState(false);
  const [attachedSnippet, setAttachedSnippet] = useState("");
  const [assistNotes, setAssistNotes] = useState([]);
  const scrollRef = useRef(null);
  const onMessageConsumedRef = useRef(onMessageConsumed);
  onMessageConsumedRef.current = onMessageConsumed;

  useEffect(() => {
    if (!incomingMessage) {
      return;
    }

    setIsOpen(true);

    if (incomingMessage.kind === "snippet") {
      setAttachedSnippet(incomingMessage.snippet ?? "");
    } else if (incomingMessage.kind === "explain") {
      setAssistNotes((previous) => [
        ...previous,
        {
          id: incomingMessage.id,
          text: incomingMessage.text,
          snippet: incomingMessage.snippet,
        },
      ]);
    }

    onMessageConsumedRef.current?.();
  }, [incomingMessage]);

  useEffect(() => {
    const node = scrollRef.current;

    if (node) {
      node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
    }
  }, [hints.length, isLoading, assistNotes.length, attachedSnippet]);

  async function handleCheckApproach() {
    if (checkingApproach || !String(approach ?? "").trim()) {
      return;
    }

    setCheckingApproach(true);

    try {
      const { getChallengeById } = await import("@/lib/challenges");
      const challenge = await getChallengeById(challengeId);

      const data = await checkApproach({
        challengeId,
        approach,
        language: challenge?.language,
      });

      setApproachFeedback(data);
    } catch {
      setApproachFeedback({
        score: null,
        feedback: "Couldn't assess that — try running it instead.",
      });
    } finally {
      setCheckingApproach(false);
    }
  }

  async function handleRequestHint() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const hint = await onRequestHint({ snippet: attachedSnippet || undefined });
      if (typeof hint === "string" && hint.trim()) {
        setHints((previous) => [...previous, hint]);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      className="mentor-glow flex h-full min-h-0 flex-col overflow-hidden rounded-[4px] border border-paper/12 bg-[#121410]"
      aria-label="Mentor panel"
      data-challenge-id={challengeId}
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="mentor-body"
        className="flex w-full items-center justify-between gap-3 border-b border-paper/10 px-4 py-3.5 text-left transition-colors hover:bg-paper/[0.03]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full border border-accent/30 bg-accent/10">
            <Sparkle className="h-3.5 w-3.5 text-accent" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="font-display text-[15px] tracking-[-0.01em] text-paper">
                Mentor
              </span>
              <span className="rounded-full border border-paper/15 px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.16em] text-paper/45">
                AI
              </span>
            </span>
            <span className="mt-0.5 block truncate font-mono text-[8px] uppercase tracking-[0.18em] text-paper/35">
              {attemptCount > 0
                ? `${attemptCount} attempt${attemptCount === 1 ? "" : "s"} · ${
                    errorMessage ? "error on the desk" : "ready for a nudge"
                  }`
                : "on standby · ask for a nudge"}
            </span>
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          {hints.length > 0 ? (
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
              {hints.length} hint{hints.length === 1 ? "" : "s"}
            </span>
          ) : null}
          <ChevronDown
            className={`h-4 w-4 text-paper/40 transition-transform duration-300 ${
              isOpen ? "" : "-rotate-90"
            }`}
          />
        </span>
      </button>

      {isOpen ? (
        <div
          id="mentor-body"
          className="flex min-h-0 flex-1 flex-col"
        >
          {hints.length === 0 && assistNotes.length === 0 && !attachedSnippet ? (
            <div className="shrink-0 px-4 pt-3.5 pb-1">
              <div className="flex items-center justify-between rounded-[4px] border border-paper/10 bg-paper/[0.025] px-3.5 py-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/45">
                  💡 Stuck on this challenge?
                </span>
                <button
                  type="button"
                  onClick={handleRequestHint}
                  disabled={isLoading || !String(userCode ?? "").trim()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Sparkle className="h-3 w-3" />
                  {isLoading ? "Thinking…" : "Get hint"}
                </button>
              </div>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="code-scroll min-h-[140px] flex-1 space-y-2.5 overflow-y-auto p-4"
              aria-live="polite"
            >
              {attachedSnippet ? (
                <div className="rounded-[3px] border border-accent/30 bg-accent/[0.06] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-accent">
                      Discussing selected code
                    </p>
                    <button
                      type="button"
                      onClick={() => setAttachedSnippet("")}
                      className="font-mono text-[8px] uppercase tracking-[0.14em] text-paper/35 transition-colors hover:text-paper/70"
                    >
                      Clear
                    </button>
                  </div>
                  <pre className="code-scroll mt-2 max-h-28 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-paper/70">
                    {attachedSnippet}
                  </pre>
                </div>
              ) : null}

              {assistNotes.map((note) => (
                <div
                  key={`${challengeId}-assist-${note.id}`}
                  className="rounded-[3px] border border-paper/10 bg-paper/[0.035] p-3.5"
                >
                  <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-accent">
                    Selected code · AI breakdown
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-paper/75">
                    {note.text}
                  </p>
                </div>
              ))}

              {hints.map((hint, index) => (
                <div
                  key={`${challengeId}-hint-${index}`}
                  className="rounded-[3px] border border-paper/10 bg-paper/[0.035] p-3.5"
                >
                  <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-accent">
                    Hint {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-paper/75">
                    {hint}
                  </p>
                </div>
              ))}

              {isLoading ? (
                <div className="flex items-center gap-2.5 rounded-[3px] border border-paper/10 bg-paper/[0.035] p-3.5 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/40">
                  <span className="h-3 w-3 animate-spin rounded-full border border-paper/20 border-t-accent" />
                  Reading your attempt
                </div>
              ) : null}
            </div>
          )}

          <div className={`flex min-h-0 flex-col ${hints.length === 0 && assistNotes.length === 0 && !attachedSnippet ? "flex-1 px-4 pb-3.5 pt-2" : "shrink-0 border-t border-paper/10 px-4 py-3"}`}>
            {errorMessage && hints.length > 0 ? (
              <p className="mb-2 line-clamp-2 font-mono text-[9px] leading-relaxed text-[#ee917c]/80">
                last error · {errorMessage.split("\n")[0]}
              </p>
            ) : null}

            {hints.length > 0 ? (
              <div className="mb-2.5 flex items-center justify-between border-b border-paper/10 pb-2.5">
                <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-paper/30">
                  Mentor · /api/hint
                </span>
                <button
                  type="button"
                  onClick={handleRequestHint}
                  disabled={isLoading || !String(userCode ?? "").trim()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-medium text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Sparkle className="h-3 w-3" />
                  {isLoading ? "Thinking…" : "Next hint"}
                </button>
              </div>
            ) : null}

            <div className={`flex flex-col ${hints.length === 0 && assistNotes.length === 0 && !attachedSnippet ? "flex-1 min-h-0" : ""}`}>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="approach"
                  className="block font-mono text-[9px] uppercase tracking-[0.2em] text-accent"
                >
                  Chat with Approach
                </label>
                <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-paper/35">
                  AI Algorithm Review
                </span>
              </div>
              <textarea
                id="approach"
                rows={hints.length === 0 ? 8 : 3}
                value={approach}
                onChange={(event) => setApproach(event.target.value)}
                placeholder="Explain your thought process or ask questions about your algorithmic approach (e.g., 'Can I solve this in O(n) using two pointers without extra memory?')..."
                className={`mt-2 w-full rounded-[4px] border border-paper/15 bg-[#0b0c0a] p-3 font-mono text-[12.5px] leading-relaxed text-paper/90 placeholder:text-paper/30 transition-all focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/30 ${
                  hints.length === 0 && assistNotes.length === 0 && !attachedSnippet
                    ? "flex-1 min-h-[160px] resize-none"
                    : "h-[85px] min-h-[75px] resize-y"
                }`}
              />
              <button
                type="button"
                onClick={handleCheckApproach}
                disabled={checkingApproach || !String(approach ?? "").trim()}
                className="mt-2.5 inline-flex shrink-0 w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[12px] font-semibold text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Sparkle className="h-3.5 w-3.5" />
                {checkingApproach ? "Discussing with Mentor…" : "Chat with approach"}
              </button>

              {approachFeedback ? (
                <div className="mt-2.5 max-h-40 overflow-y-auto rounded-[4px] border border-accent/25 bg-accent/[0.04] p-3 text-[12px] leading-relaxed text-paper/85">
                  <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-accent">
                    Mentor Feedback
                  </p>
                  <p className="mt-1 text-paper/85">
                    {approachFeedback.feedback ?? "No feedback returned."}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}