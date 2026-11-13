"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Sparkle } from "@/components/icons";

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
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hints, setHints] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const node = scrollRef.current;

    if (node) {
      node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
    }
  }, [hints.length, isLoading]);

  async function handleRequestHint() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const hint = await onRequestHint();
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
          <div
            ref={scrollRef}
            className="code-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4"
            aria-live="polite"
          >
            {hints.length === 0 ? (
              <div className="rounded-[3px] border border-dashed border-paper/15 bg-paper/[0.02] p-4">
                <p className="font-display text-[17px] leading-snug text-paper/85">
                  Stuck? Hints will appear here.
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-paper/45">
                  Write a first attempt, then request a hint. You will get one
                  nudge at a time — enough to keep moving, never the answer.
                </p>
              </div>
            ) : (
              hints.map((hint, index) => (
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
              ))
            )}

            {isLoading ? (
              <div className="flex items-center gap-2.5 rounded-[3px] border border-paper/10 bg-paper/[0.035] p-3.5 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/40">
                <span className="h-3 w-3 animate-spin rounded-full border border-paper/20 border-t-accent" />
                Reading your attempt
              </div>
            ) : null}
          </div>

          <div className="border-t border-paper/10 p-4">
            {errorMessage ? (
              <p className="mb-3 line-clamp-2 font-mono text-[9px] leading-relaxed text-[#ee917c]/80">
                last error · {errorMessage.split("\n")[0]}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleRequestHint}
              disabled={isLoading || !String(userCode ?? "").trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[12px] font-semibold text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Sparkle className="h-3.5 w-3.5" />
              {isLoading
                ? "Thinking…"
                : hints.length > 0
                  ? "Request another hint"
                  : "Request a hint"}
            </button>

            <p className="mt-2.5 text-center font-mono text-[8px] uppercase tracking-[0.14em] text-paper/25">
              Mock mentor · swap in /api/hint later
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}