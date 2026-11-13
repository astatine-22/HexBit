"use client";

import { useState, useEffect, useMemo } from "react";
import marketplacePacks from "@/data/marketplace-packs.json";
import { playPackUnlockChime, playResonantTone } from "@/lib/audioHarmonics";

/**
 * The Plugin Rack (Skill Marketplace Drawer)
 * Allows developers to unlock advanced external skill sample packs using their earned Studio XP.
 */
export default function MarketplaceDrawer({
  isOpen,
  onClose,
  targetSkill,
  unlockedPacks = [],
  userProgress = {},
  userRank = "intermediate",
  onPackUnlocked,
}) {
  const [packs, setPacks] = useState(marketplacePacks);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [unlockingId, setUnlockingId] = useState(null);
  const [unlockError, setUnlockError] = useState("");
  const [unlockSuccess, setUnlockSuccess] = useState("");

  const currentXp = userProgress?.leaderboardStats?.xp ?? userProgress?.xp ?? 170;

  // Pre-filter to target skill if opened from a specific waveform node
  useEffect(() => {
    if (targetSkill && typeof targetSkill === "object" && targetSkill.category) {
      setSelectedCategory(targetSkill.category);
    } else {
      setSelectedCategory("all");
    }
    setUnlockError("");
    setUnlockSuccess("");
  }, [targetSkill, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const categories = useMemo(() => {
    const cats = new Set(packs.map((p) => p.category));
    return ["all", ...Array.from(cats)];
  }, [packs]);

  const filteredPacks = useMemo(() => {
    if (selectedCategory === "all") return packs;
    return packs.filter((p) => p.category === selectedCategory);
  }, [packs, selectedCategory]);

  const handleUnlock = async (pack) => {
    setUnlockingId(pack.id);
    setUnlockError("");
    setUnlockSuccess("");

    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unlock",
          packId: pack.id,
          username: userProgress?.username || "guest",
          currentProgress: userProgress,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to unlock marketplace pack.");
      }

      // Play celebratory ascending acoustic arpeggio
      playPackUnlockChime();

      setUnlockSuccess(`🎉 Unlocked "${pack.skillName}"! Added to your Studio Rack.`);

      if (onPackUnlocked) {
        onPackUnlocked(pack.id, data.remainingXp, pack);
      }
    } catch (err) {
      setUnlockError(err.message || "Could not complete unlock.");
    } finally {
      setUnlockingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Hardware Studio Rack Mount Drawer */}
      <div className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-paper/20 bg-ink-2 shadow-2xl overflow-hidden">
        {/* Analog rack screws & texture */}
        <div className="grain absolute inset-0 opacity-20 pointer-events-none" aria-hidden="true" />

        {/* Top Hardware Faceplate */}
        <div className="relative border-b border-paper/15 bg-[#0e0f12] px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded bg-accent/15 text-accent text-sm font-bold border border-accent/30 font-mono">
                FX
              </span>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent font-semibold">
                  The Plugin Rack
                </p>
                <h2 className="font-display text-[20px] text-paper">
                  Studio Skill Marketplace
                </h2>
              </div>
            </div>

            {/* Studio XP Meter */}
            <div className="flex items-center gap-2 rounded border border-accent/30 bg-accent/10 px-3 py-1.5 font-mono text-[11px] text-accent">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span>Balance: <strong>{currentXp} XP</strong></span>
            </div>
          </div>

          <p className="mt-2 text-[12px] text-paper/60 leading-relaxed">
            Acquire external infrastructure and advanced ecosystem packs to patch missing frequency bands in your Audition roadmap.
          </p>

          {/* Category Filter Pills */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-[3px] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition-colors ${
                  selectedCategory === cat
                    ? "bg-paper text-ink font-bold"
                    : "border border-paper/15 bg-ink-3 text-paper/60 hover:text-paper"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {unlockError && (
          <div className="mx-6 mt-4 rounded border border-[#ff5c77]/30 bg-[#ff5c77]/10 p-3 font-mono text-[11px] text-[#ff5c77]">
            ⚠ {unlockError}
          </div>
        )}
        {unlockSuccess && (
          <div className="mx-6 mt-4 rounded border border-accent/30 bg-accent/10 p-3 font-mono text-[11px] text-accent">
            {unlockSuccess}
          </div>
        )}

        {/* Scrollable Pack List */}
        <div className="relative flex-1 overflow-y-auto p-6 space-y-4">
          {filteredPacks.map((pack) => {
            const isUnlocked = unlockedPacks.includes(pack.id);
            const canAfford = currentXp >= pack.xpCost;
            const meetsPrereq = currentXp >= pack.prerequisiteXp;
            const isUnlocking = unlockingId === pack.id;

            return (
              <div
                key={pack.id}
                className={`relative rounded-[3px] border p-4 transition-all ${
                  isUnlocked
                    ? "border-accent/40 bg-accent/5 shadow-[0_0_15px_rgba(217,246,90,0.06)]"
                    : "border-paper/15 bg-ink-3 hover:border-paper/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-paper/40">
                        {pack.category}
                      </span>
                      <span className="font-mono text-[8px] text-paper/40">
                        · ~{pack.estimatedHours} hrs
                      </span>
                    </div>
                    <h3 className="mt-0.5 font-display text-[17px] text-paper font-semibold">
                      {pack.skillName}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  {isUnlocked ? (
                    <span className="rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-accent font-bold">
                      ✓ Installed in Rack
                    </span>
                  ) : (
                    <span className="rounded border border-paper/20 bg-ink px-2 py-0.5 font-mono text-[10px] text-accent font-bold">
                      {pack.xpCost} XP
                    </span>
                  )}
                </div>

                <p className="mt-2 text-[12px] text-paper/70 leading-relaxed">
                  {pack.description}
                </p>

                {/* Pack Tasks Preview */}
                <div className="mt-3 border-t border-paper/10 pt-2.5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-paper/40">
                    Included Drills & Projects ({pack.tasks?.length || 0})
                  </p>
                  <div className="mt-1.5 space-y-1">
                    {pack.tasks?.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between font-mono text-[10px] text-paper/75"
                      >
                        <span className="truncate pr-2">↳ {task.title}</span>
                        <span className="shrink-0 text-accent font-semibold">+{task.xp} XP</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer / Unlock Button */}
                <div className="mt-4 flex items-center justify-between border-t border-paper/10 pt-3">
                  <div className="font-mono text-[9px] text-paper/50">
                    Prereq: Min {pack.prerequisiteXp} XP ({pack.prerequisiteRank})
                  </div>

                  {isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => playResonantTone(440, 0.8)}
                      className="rounded-[3px] border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[10px] text-accent hover:bg-accent hover:text-ink transition-colors"
                    >
                      Audit Resonator
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isUnlocking || !meetsPrereq || !canAfford}
                      onClick={() => handleUnlock(pack)}
                      className={`rounded-[3px] px-3.5 py-1.5 font-mono text-[10px] uppercase font-bold tracking-wider transition-all ${
                        !meetsPrereq
                          ? "border border-paper/15 bg-ink text-paper/30 cursor-not-allowed"
                          : !canAfford
                          ? "border border-[#ff5c77]/30 bg-[#ff5c77]/10 text-[#ff5c77] cursor-not-allowed"
                          : "bg-accent text-ink hover:opacity-90 active:scale-95 shadow-[0_0_10px_rgba(217,246,90,0.3)]"
                      }`}
                    >
                      {isUnlocking
                        ? "Installing..."
                        : !meetsPrereq
                        ? `Locked (${pack.prerequisiteXp} XP req)`
                        : !canAfford
                        ? `Need ${pack.xpCost - currentXp} more XP`
                        : `Unlock Pack (-${pack.xpCost} XP)`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Drawer Control Bar */}
        <div className="relative border-t border-paper/15 bg-[#0e0f12] px-6 py-4 flex items-center justify-between">
          <p className="font-mono text-[9px] text-paper/40">
            Press <kbd className="rounded border border-paper/20 px-1 py-0.5 text-paper/70">ESC</kbd> to return to Audition
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] border border-paper/20 bg-ink-3 px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider text-paper hover:border-paper/40 transition-colors"
          >
            Close Rack
          </button>
        </div>
      </div>
    </div>
  );
}
