"use client";

import { cn } from "@/lib/utils";
import { ArrowRight, Check } from "@/components/icons";
import { useReducedMotion } from "framer-motion";
import {
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";

function inRange(index, length) {
  return Math.min(Math.max(0, index), Math.max(0, length - 1));
}

export function OrbitCardStack({
  items = [],
  className,
  cardClassName,
  defaultActiveIndex = 2,
  spread = 150,
  lift = 30,
  onActiveChange,
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const cards = items.length ? items : [];
  const restingIndex = inRange(defaultActiveIndex, cards.length);
  const [activeIndex, setActiveIndex] = useState(restingIndex);
  const [open, setOpen] = useState(false);
  const stageRef = useRef(null);
  const midpoint = (cards.length - 1) / 2;

  const layouts = useMemo(
    () =>
      cards.map((_, index) => {
        const orbit = index - midpoint;
        const stack = index - restingIndex;
        return {
          open: {
            x: orbit * spread,
            y: Math.abs(orbit) * 26 + Math.max(0, Math.abs(orbit) - 1) * 8,
            rotation: orbit * 7.5,
          },
          closed: {
            x: stack * 12,
            y: Math.abs(stack) * 5,
            rotation: stack * 2.5,
          },
        };
      }),
    [cards, midpoint, restingIndex, spread],
  );

  const activate = (index) => {
    const next = inRange(index, cards.length);
    setOpen(true);
    setActiveIndex(next);
    onActiveChange?.(cards[next], next);
  };

  const close = () => {
    setOpen(false);
    setActiveIndex(restingIndex);
  };

  const leaveFocus = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) close();
  };

  if (!cards.length) return null;

  return (
    <div
      className={cn(
        "isolate relative flex min-h-[460px] w-full items-center justify-center overflow-hidden py-8 px-4 select-none",
        className,
      )}
    >
      <div
        ref={stageRef}
        className="relative h-[430px] w-full max-w-[960px]"
        onMouseLeave={close}
        onBlur={leaveFocus}
        role="list"
        aria-label="Orbit card stack"
      >
        {cards.map((item, index) => {
          const position = open ? layouts[index].open : layouts[index].closed;
          const active = index === activeIndex;
          const accentColor = item.accent || "#d9f65a";

          const style = {
            zIndex: active ? 20 : 10 - Math.abs(index - activeIndex),
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${
              position.y - (open && active ? lift : 0)
            }px)) rotate(${position.rotation}deg) scale(${open ? 0.985 : 0.96})`,
            transitionDuration: reduceMotion ? "0ms" : "420ms",
          };

          return (
            <article
              key={item.id || `${item.title || item.name}-${index}`}
              role="listitem"
              tabIndex={0}
              aria-current={active ? "true" : undefined}
              className={cn(
                "absolute left-1/2 top-1/2 w-[min(82vw,20.5rem)] origin-bottom cursor-pointer rounded-[4px] border p-5 outline-none transition-[transform] ease-[cubic-bezier(.2,.8,.2,1)] shadow-2xl",
                active
                  ? "border-accent/80 bg-[#161711] shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_20px_rgba(217,246,90,0.15)] ring-1 ring-accent"
                  : "border-paper/15 bg-[#12130e] shadow-[0_15px_40px_rgba(0,0,0,0.85)] hover:border-paper/35",
                cardClassName,
              )}
              style={style}
              onMouseEnter={() => activate(index)}
              onFocus={() => activate(index)}
              onClick={() => {
                activate(index);
                if (item.onClick) {
                  item.onClick();
                } else if (item.href && active) {
                  window.location.href = item.href;
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  const next = (index + 1) % cards.length;
                  activate(next);
                  stageRef.current?.querySelectorAll("[role=listitem]")[next]?.focus();
                }
                if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  event.preventDefault();
                  const next = (index - 1 + cards.length) % cards.length;
                  activate(next);
                  stageRef.current?.querySelectorAll("[role=listitem]")[next]?.focus();
                }
                if (event.key === "Enter") {
                  if (item.onClick) {
                    item.onClick();
                  } else if (item.href) {
                    window.location.href = item.href;
                  }
                }
                if (event.key === "Escape") {
                  event.currentTarget.blur();
                  close();
                }
              }}
            >
              {/* Retro Vinyl Record Sleeve Header */}
              <div className="relative overflow-hidden rounded-[3px] border border-paper/10 bg-gradient-to-br from-[#1d1f16] to-[#0d0e0a] p-4">
                <div className="grain absolute inset-0 opacity-40 pointer-events-none" />
                
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-[8px] uppercase tracking-[0.22em] font-semibold"
                    style={{ color: accentColor }}
                  >
                    {item.role || item.category || item.language || "PRESSING"}
                  </span>
                  <span className="rounded border border-paper/20 bg-ink px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-paper/70">
                    {item.stat || item.difficulty || "TRACK"}
                  </span>
                </div>

                <div className="my-3 flex items-center justify-center">
                  {/* Miniature concentric vinyl ring */}
                  <div className="relative h-16 w-16 rounded-full border border-paper/20 bg-[#0a0b08] shadow-inner flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full border border-paper/10 bg-[#141510] flex items-center justify-center">
                      <div className="h-4 w-4 rounded-full bg-accent/20 border border-accent/40" />
                    </div>
                  </div>
                </div>

                <p className="font-mono text-[7px] text-paper/40 uppercase tracking-[0.2em] text-center">
                  33⅓ RPM · STUDIO PRESSING
                </p>
              </div>

              {/* Card Body */}
              <div className="pt-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-[18px] font-semibold leading-tight text-paper group-hover:text-accent transition-colors line-clamp-1">
                    {item.title || item.name}
                  </h3>
                  {item.percentage !== undefined && (
                    <span className="font-mono text-[10px] font-bold text-accent">
                      {item.percentage}%
                    </span>
                  )}
                </div>

                <p className="mt-2 text-[12px] leading-relaxed text-paper/60 line-clamp-2">
                  {item.description}
                </p>

                {item.percentage !== undefined && (
                  <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                )}

                {/* Footer Action */}
                <div className="mt-4 flex items-center justify-between border-t border-paper/10 pt-3">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-semibold">
                    {item.statusLabel || (item.solved ? "✓ Mastered" : "Ready to Solve")}
                  </span>

                  {item.onClick ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        item.onClick();
                      }}
                      className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-paper hover:text-accent transition-colors"
                    >
                      <span>{item.actionLabel || "Open"}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  ) : item.href ? (
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-paper hover:text-accent transition-colors"
                    >
                      <span>{item.actionLabel || "Audition"}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-paper/40">
                      <span>Fan Out</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default OrbitCardStack;
