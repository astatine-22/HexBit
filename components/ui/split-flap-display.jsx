"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, useCallback } from "react";

/* ─── Character Set ─────────────────────────────────────────── */

const CHARACTERS = " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$.,!?:;+-=%&#@/·";

function getNextChar(current) {
  const idx = CHARACTERS.indexOf(current);
  if (idx === -1 || idx >= CHARACTERS.length - 1) return CHARACTERS[0] ?? " ";
  return CHARACTERS[idx + 1] ?? " ";
}

/* ─── Individual Flap Cell ──────────────────────────────────── */

function FlapCell({
  targetChar = " ",
  size = "md",
  delay = 0,
  flipSpeed = 35,
}) {
  const [displayChar, setDisplayChar] = useState(" ");
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipPhase, setFlipPhase] = useState("idle");
  const prevCharRef = useRef(" ");
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    cleanup();
    const target = String(targetChar || " ").toUpperCase();

    if (displayChar === target) {
      setIsFlipping(false);
      setFlipPhase("idle");
      return;
    }

    timeoutRef.current = setTimeout(() => {
      setIsFlipping(true);

      intervalRef.current = setInterval(() => {
        setDisplayChar((prev) => {
          const next = getNextChar(prev);
          setFlipPhase("top-down");
          setTimeout(() => setFlipPhase("bottom-up"), flipSpeed * 0.4);
          setTimeout(() => setFlipPhase("idle"), flipSpeed * 0.8);

          prevCharRef.current = prev;

          if (next === target) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setTimeout(() => {
              setIsFlipping(false);
              setFlipPhase("idle");
            }, flipSpeed);
          }
          return next;
        });
      }, flipSpeed);
    }, delay);

    return cleanup;
  }, [targetChar, flipSpeed, delay, cleanup, displayChar]);

  const sizeMap = {
    xs: { cell: "w-[15px] h-[22px] text-[11px]", gap: "gap-[1px]" },
    sm: { cell: "w-[24px] h-[34px] text-[15px]", gap: "gap-[1px]" },
    md: { cell: "w-[34px] h-[48px] text-[22px]", gap: "gap-[1px]" },
    lg: { cell: "w-[48px] h-[64px] text-[30px]", gap: "gap-[2px]" },
  };

  const s = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={cn(
        "relative select-none font-mono font-bold leading-none inline-flex items-center justify-center",
        s.cell
      )}
      style={{ perspective: "400px" }}
    >
      {/* ── Static top half ──────────────── */}
      <div
        className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-[2px]"
        style={{
          background: "linear-gradient(180deg, #1b1c18 0%, #141511 100%)",
          borderBottom: "1px solid rgba(0,0,0,0.6)",
        }}
      >
        <span
          className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-[48%] text-[#e8e5da] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {displayChar}
        </span>
      </div>

      {/* ── Static bottom half ───────────── */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-[2px]"
        style={{
          background: "linear-gradient(180deg, #12130e 0%, #0d0e0a 100%)",
        }}
      >
        <span
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[48%] text-[#d0cdc2] drop-shadow-[0_-1px_1px_rgba(0,0,0,0.8)]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {displayChar}
        </span>
      </div>

      {/* ── Flipping top panel ───────────── */}
      {isFlipping && flipPhase === "top-down" && (
        <div
          className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-[2px] z-10"
          style={{
            background: "linear-gradient(180deg, #22231c 0%, #181913 100%)",
            transformOrigin: "bottom center",
            animation: `flapTopDown ${flipSpeed * 0.4}ms ease-in forwards`,
          }}
        >
          <span
            className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-[48%] text-[#e8e5da]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {prevCharRef.current}
          </span>
        </div>
      )}

      {/* ── Flipping bottom panel ────────── */}
      {isFlipping && flipPhase === "bottom-up" && (
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-[2px] z-10"
          style={{
            background: "linear-gradient(180deg, #161711 0%, #0f100b 100%)",
            transformOrigin: "top center",
            animation: `flapBottomUp ${flipSpeed * 0.4}ms ease-out forwards`,
          }}
        >
          <span
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[48%] text-[#d0cdc2]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {displayChar}
          </span>
        </div>
      )}

      {/* ── Center divider line (Split flap crease) ──── */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
        style={{
          height: "1px",
          background: "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(20,21,15,0.7) 50%, rgba(0,0,0,0.9) 100%)",
          boxShadow: "0 1px 0 rgba(217,246,90,0.12)",
        }}
      />

      {/* ── Subtle inner bevel overlay ──── */}
      <div
        className="absolute inset-0 rounded-[2px] z-20 pointer-events-none"
        style={{
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06), inset 0 -1px 1px rgba(0,0,0,0.8)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      />
    </div>
  );
}

/* ─── Indicator Strip ───────────────────────────────────────── */

function IndicatorStrip({
  color = "#d9f65a",
  size = "md",
}) {
  const heightMap = { xs: "h-[22px]", sm: "h-[34px]", md: "h-[48px]", lg: "h-[64px]" };
  return (
    <div
      className={cn("w-[4px] rounded-[1px] flex-shrink-0 self-stretch", heightMap[size] || "h-[48px]")}
      style={{
        background: `linear-gradient(180deg, ${color} 0%, ${color}99 40%, ${color}66 60%, ${color}99 100%)`,
        boxShadow: `0 0 6px ${color}66, inset 0 1px 1px rgba(255,255,255,0.3)`,
      }}
    />
  );
}

/* ─── Row Component ─────────────────────────────────────────── */

function FlapRow({
  text = "",
  columns = 16,
  size = "md",
  accentColor = "#d9f65a",
  showIndicators = true,
  staggerDelay = 25,
  flipSpeed = 30,
}) {
  const padded = String(text || "")
    .toUpperCase()
    .padEnd(columns, " ")
    .substring(0, columns);

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
      {showIndicators && <IndicatorStrip color={accentColor} size={size} />}
      <div className="flex gap-[2px]">
        {padded.split("").map((char, i) => (
          <FlapCell
            key={i}
            targetChar={char}
            size={size}
            delay={i * staggerDelay}
            flipSpeed={flipSpeed}
          />
        ))}
      </div>
      {showIndicators && <IndicatorStrip color={accentColor} size={size} />}
    </div>
  );
}

/* ─── Keyframes (injected once into document) ───────────────── */

const KEYFRAMES_ID = "split-flap-keyframes";

function useInjectKeyframes() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(KEYFRAMES_ID)) return;

    const style = document.createElement("style");
    style.id = KEYFRAMES_ID;
    style.textContent = `
      @keyframes flapTopDown {
        0%   { transform: rotateX(0deg); }
        100% { transform: rotateX(-90deg); }
      }
      @keyframes flapBottomUp {
        0%   { transform: rotateX(90deg); }
        100% { transform: rotateX(0deg); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const el = document.getElementById(KEYFRAMES_ID);
      if (el) el.remove();
    };
  }, []);
}

/* ─── Main Export ────────────────────────────────────────────── */

export function SplitFlapDisplay({
  rows,
  text,
  columns = 16,
  size = "md",
  accentColor = "#d9f65a",
  showIndicators = true,
  staggerDelay = 25,
  flipSpeed = 30,
  className,
}) {
  useInjectKeyframes();

  // Simple single-row text mode
  if (text !== undefined && !rows) {
    return (
      <div
        className={cn(
          "inline-flex flex-col gap-1.5 p-2 sm:p-2.5 rounded-[4px]",
          className
        )}
        style={{
          background: "linear-gradient(180deg, #12130e 0%, #0a0b07 100%)",
          border: "1px solid rgba(232,229,218,0.12)",
          boxShadow:
            "0 12px 30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <FlapRow
          text={text}
          columns={columns}
          size={size}
          accentColor={accentColor}
          showIndicators={showIndicators}
          staggerDelay={staggerDelay}
          flipSpeed={flipSpeed}
        />
      </div>
    );
  }

  // Multi-row board mode
  return (
    <div
      className={cn(
        "inline-flex flex-col gap-2 p-3 sm:p-4 rounded-[4px]",
        className
      )}
      style={{
        background: "linear-gradient(180deg, #12130e 0%, #0a0b07 100%)",
        border: "1px solid rgba(232,229,218,0.12)",
        boxShadow:
          "0 18px 45px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {(rows ?? []).map((row, idx) => {
        const combined = `${row.label}${" ".repeat(
          Math.max(1, columns - row.label.length - row.value.length)
        )}${row.value}`;
        return (
          <FlapRow
            key={idx}
            text={combined}
            columns={columns}
            size={size}
            accentColor={accentColor}
            showIndicators={showIndicators}
            staggerDelay={staggerDelay}
            flipSpeed={flipSpeed}
          />
        );
      })}
    </div>
  );
}

export default SplitFlapDisplay;
