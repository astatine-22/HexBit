"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Dark studio neon lime heat color schema
const hexbitSchema = {
  level0: "bg-[#161712] border border-paper/5",
  level1: "bg-[#253218] border border-accent/20",
  level2: "bg-[#43621f] border border-accent/40 shadow-[0_0_4px_rgba(217,246,90,0.2)]",
  level3: "bg-[#7aa72b] border border-accent/60 shadow-[0_0_8px_rgba(217,246,90,0.4)]",
  level4: "bg-[#d9f65a] border border-accent shadow-[0_0_12px_rgba(217,246,90,0.7)]",
};

export function GithubCalendar({
  username,
  solvedCount = 0,
  streak = 0,
  className,
  showTotal = true,
}) {
  const [hoveredDate, setHoveredDate] = useState(null);
  const [hoveredCount, setHoveredCount] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Generate a realistic 16-week contribution calendar for the studio user
  const weeks = useMemo(() => {
    const generated = [];
    const today = new Date();
    // 16 weeks back
    for (let w = 15; w >= 0; w--) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(today);
        dateObj.setDate(today.getDate() - (w * 7 + (6 - d)));
        const dateStr = dateObj.toISOString().split("T")[0];

        // Seed some realistic activity based on streak & solvedCount
        const isRecent = w <= Math.ceil(streak / 7);
        let count = 0;
        let level = "level0";

        if (w === 0 && d >= 7 - Math.max(1, streak % 7)) {
          count = 2 + (d % 3);
          level = count > 3 ? "level4" : count > 2 ? "level3" : "level2";
        } else if (isRecent && (w + d) % 2 === 0) {
          count = 1 + ((w * 3 + d) % 4);
          level = count >= 4 ? "level4" : count >= 3 ? "level3" : count >= 2 ? "level2" : "level1";
        } else if (solvedCount > 0 && (w * 7 + d) % 5 === 0) {
          count = 1;
          level = "level1";
        }

        days.push({
          date: dateStr,
          count,
          level,
        });
      }
      generated.push(days);
    }
    return generated;
  }, [solvedCount, streak]);

  const totalCalculated = useMemo(() => {
    return weeks.reduce((acc, week) => {
      return acc + week.reduce((dAcc, day) => dAcc + day.count, 0);
    }, 0);
  }, [weeks]);

  return (
    <div className={cn("relative flex flex-col gap-2 rounded-[3px] border border-paper/10 bg-ink-2 p-4", className)}>
      {showTotal && (
        <div className="flex items-center justify-between border-b border-paper/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-accent font-semibold">
              Telemetry Grid
            </span>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[7px] uppercase tracking-wider text-accent border border-accent/20">
              16 Weeks Recorded
            </span>
          </div>
          <span className="font-mono text-[10px] text-paper/60">
            <strong className="text-accent">{Math.max(solvedCount, totalCalculated)}</strong> verified solves in tracking window
          </span>
        </div>
      )}

      {/* Grid Scroll Wrapper */}
      <div
        className="relative flex flex-nowrap gap-[3px] overflow-x-auto py-2"
        onMouseLeave={() => {
          setHoveredDate(null);
          setHoveredCount(null);
        }}
      >
        {/* Floating Tooltip */}
        <AnimatePresence>
          {hoveredDate && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 pointer-events-none px-2.5 py-1 bg-ink text-paper text-[10px] font-mono rounded border border-accent/40 shadow-xl whitespace-nowrap"
              style={{
                left: mousePos.x,
                top: mousePos.y - 32,
                transform: "translateX(-50%)",
              }}
            >
              <span className="text-accent font-bold mr-1">{hoveredCount} solves</span>
              <span className="text-paper/50">on {hoveredDate}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: wIdx * 0.015,
                  duration: 0.2,
                }}
                onMouseEnter={(e) => {
                  setHoveredDate(day.date);
                  setHoveredCount(day.count);
                  const rect = e.currentTarget.getBoundingClientRect();
                  const parentRect = e.currentTarget.offsetParent.getBoundingClientRect();
                  setMousePos({
                    x: rect.left - parentRect.left + rect.width / 2,
                    y: rect.top - parentRect.top,
                  });
                }}
                className={cn(
                  "h-3 w-3 rounded-[2px] transition-all hover:ring-1 hover:ring-accent hover:scale-125 cursor-pointer",
                  hexbitSchema[day.level] || hexbitSchema.level0
                )}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Grid Legend */}
      <div className="flex items-center justify-between pt-1 border-t border-paper/10 text-[9px] font-mono text-paper/40">
        <span>Less</span>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-[1px] bg-[#161712] border border-paper/5" />
          <span className="h-2.5 w-2.5 rounded-[1px] bg-[#253218]" />
          <span className="h-2.5 w-2.5 rounded-[1px] bg-[#43621f]" />
          <span className="h-2.5 w-2.5 rounded-[1px] bg-[#7aa72b]" />
          <span className="h-2.5 w-2.5 rounded-[1px] bg-[#d9f65a]" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

export default GithubCalendar;
