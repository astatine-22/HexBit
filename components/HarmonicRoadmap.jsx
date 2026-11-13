"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  SAPTAK_FREQUENCIES,
  playResonantTone,
  playDampenedPing,
  playGhostBandClick,
} from "@/lib/audioHarmonics";

/**
 * Harmonic Frequency Roadmap
 * Visualizes career readiness and job requirements as an acoustic soundwave / harmonic ribbon.
 */
export default function HarmonicRoadmap({
  skills = [],
  unlockedPacks = [],
  onOpenMarketplace,
  onSelectChallenge,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeNode, setActiveNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [saptakMode, setSaptakMode] = useState(true); // Saptak (Sa, Re, Ga) vs Western (C4, D4, E4)

  // Map each skill to an acoustic frequency band along the 0..1 spectrum
  const mappedNodes = useMemo(() => {
    if (!skills || skills.length === 0) return [];

    return skills.map((skill, index) => {
      const positionRatio = (index + 1) / (skills.length + 1);
      const saptakIndex = Math.min(
        SAPTAK_FREQUENCIES.length - 1,
        Math.floor(positionRatio * SAPTAK_FREQUENCIES.length)
      );
      const saptakData = SAPTAK_FREQUENCIES[saptakIndex] || SAPTAK_FREQUENCIES[0];

      // Frequency calculation (from 160Hz up to ~880Hz)
      const baseFreq = 160 + positionRatio * 520;

      return {
        ...skill,
        id: `node-${index}-${skill.name}`,
        index,
        positionRatio,
        frequency: Math.round(baseFreq),
        saptakData,
      };
    });
  }, [skills]);

  // Canvas Waveform Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let time = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const centerY = height * 0.52;

      // Draw subtle frequency grid lines
      ctx.strokeStyle = "rgba(232, 229, 218, 0.04)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 6; i++) {
        const x = (width / 7) * i;
        ctx.beginPath();
        ctx.moveTo(x, 15);
        ctx.lineTo(x, height - 15);
        ctx.stroke();
      }

      // Draw center baseline (zero frequency axis)
      ctx.strokeStyle = "rgba(232, 229, 218, 0.07)";
      ctx.beginPath();
      ctx.setLineDash([3, 5]);
      ctx.moveTo(10, centerY);
      ctx.lineTo(width - 10, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isPlaying) {
        time += 0.018;
      }

      // Render 3 layered harmonic ribbons (fundamental, 2nd harmonic, overtone)
      const ribbons = [
        {
          amplitude: 34,
          speed: 1.0,
          color: "rgba(217, 246, 90, 0.7)", // neon lime
          fillGradient: ["rgba(217, 246, 90, 0.12)", "rgba(217, 246, 90, 0.0)"],
          lineWidth: 2.2,
          freqMultiplier: 0.014,
        },
        {
          amplitude: 24,
          speed: 1.4,
          color: "rgba(90, 226, 246, 0.55)", // cyan overtone
          fillGradient: ["rgba(90, 226, 246, 0.08)", "rgba(90, 226, 246, 0.0)"],
          lineWidth: 1.8,
          freqMultiplier: 0.022,
        },
        {
          amplitude: 18,
          speed: 0.75,
          color: "rgba(180, 130, 255, 0.45)", // subtle violet resonance
          fillGradient: ["rgba(180, 130, 255, 0.06)", "rgba(180, 130, 255, 0.0)"],
          lineWidth: 1.5,
          freqMultiplier: 0.009,
        },
      ];

      ribbons.forEach((ribbon) => {
        ctx.beginPath();
        for (let x = 0; x <= width; x += 3) {
          const normX = x / width;
          // Harmonic wave equation with taper at both ends
          const envelope = Math.sin(normX * Math.PI); // 0 at edges, 1 at center
          const y =
            centerY +
            Math.sin(x * ribbon.freqMultiplier + time * ribbon.speed) *
              ribbon.amplitude *
              envelope +
            Math.cos(x * ribbon.freqMultiplier * 1.8 - time * 0.9) *
              (ribbon.amplitude * 0.35) *
              envelope;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = ribbon.color;
        ctx.lineWidth = ribbon.lineWidth;
        ctx.stroke();
      });

      // Render Ghost Silent Band indicator if any missing marketplace gaps exist
      const hasGaps = mappedNodes.some((n) => n.status === "marketplace_gap");
      if (hasGaps) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 99, 125, 0.4)";
        ctx.setLineDash([4, 6]);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 4) {
          const normX = x / width;
          const envelope = Math.sin(normX * Math.PI);
          const y =
            centerY +
            Math.sin(x * 0.035 + time * 0.6) * 14 * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Auto-resize canvas buffer to match display resolution
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          canvas.width = Math.floor(width * window.devicePixelRatio);
          canvas.height = Math.floor(height * window.devicePixelRatio);
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [isPlaying, mappedNodes]);

  // Audio trigger on node click
  const handleNodeClick = (node) => {
    setActiveNode(node);

    if (node.status === "mastered") {
      playResonantTone(node.saptakData.freq, 1.4);
    } else if (node.status === "learning") {
      playDampenedPing(node.saptakData.freq);
    } else if (node.status === "marketplace_gap") {
      playGhostBandClick();
      if (onOpenMarketplace) {
        onOpenMarketplace(node.marketplacePack || node.name);
      }
    } else {
      playDampenedPing(node.saptakData.freq * 0.75);
    }
  };

  // Play full harmonic chord across all mastered skills
  const handleAuditionAllNotes = () => {
    mappedNodes.forEach((node, idx) => {
      setTimeout(() => {
        if (node.status === "mastered") {
          playResonantTone(node.saptakData.freq, 1.2);
        } else if (node.status === "learning") {
          playDampenedPing(node.saptakData.freq);
        } else {
          playGhostBandClick();
        }
      }, idx * 140);
    });
  };

  return (
    <div className="relative rounded-[3px] border border-paper/15 bg-ink-2 p-5 lg:p-6 shadow-2xl overflow-hidden">
      {/* Vinyl record groove texture overlay */}
      <div className="grain absolute inset-0 opacity-20 pointer-events-none" aria-hidden="true" />

      {/* Header & Controls */}
      <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-paper/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-accent font-semibold">
              Harmonic Frequency Roadmap
            </span>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[7px] uppercase tracking-wider text-accent border border-accent/20">
              Acoustic Telemetry
            </span>
          </div>
          <h3 className="mt-1 font-display text-[19px] text-paper">
            Skill Resonance & Octave Spectrum
          </h3>
          <p className="font-mono text-[11px] text-paper/50">
            Click nodes along the acoustic waveform to strike their frequency tone and inspect readiness.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Saptak / Western Toggle */}
          <button
            type="button"
            onClick={() => setSaptakMode(!saptakMode)}
            className="rounded-[3px] border border-paper/20 bg-ink-3 px-2.5 py-1 font-mono text-[10px] text-paper/70 hover:border-paper/40 transition-colors"
            title="Toggle between Indian Saptak and Western Scale"
          >
            Scale: <span className="text-accent font-bold">{saptakMode ? "Saptak (Sa-Re-Ga)" : "Western (C-D-E)"}</span>
          </button>

          {/* Strum full chord */}
          <button
            type="button"
            onClick={handleAuditionAllNotes}
            className="flex items-center gap-1.5 rounded-[3px] border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[10px] font-semibold text-accent hover:bg-accent hover:text-ink transition-colors"
          >
            <span>🎸</span> Strum Chord
          </button>

          {/* Wave animation toggle */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="rounded-[3px] border border-paper/20 bg-ink-3 px-2.5 py-1 font-mono text-[10px] text-paper/60 hover:text-paper transition-colors"
          >
            {isPlaying ? "Pause Wave" : "Play Wave"}
          </button>

          {/* Open Marketplace Trigger */}
          <button
            type="button"
            onClick={() => onOpenMarketplace && onOpenMarketplace(null)}
            className="flex items-center gap-1.5 rounded-[3px] border border-paper/30 bg-ink-3 px-3 py-1 font-mono text-[10px] text-paper/90 hover:border-accent hover:text-accent transition-colors"
          >
            <span>📦</span> The Plugin Rack
          </button>
        </div>
      </div>

      {/* Main Interactive Soundwave Area */}
      <div
        ref={containerRef}
        className="relative my-4 h-48 w-full select-none overflow-hidden rounded-[3px] bg-[#0c0d0f] border border-paper/10"
      >
        {/* HTML5 Canvas Waveform */}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />

        {/* Acoustic Frequency Markings */}
        <div className="absolute top-2 left-3 right-3 flex justify-between pointer-events-none font-mono text-[8px] uppercase tracking-wider text-paper/30">
          <span>Fundamental (Bass / Syntax)</span>
          <span>Mid Harmonics (APIs & Systems)</span>
          <span>Overtones (Cloud & Streaming)</span>
        </div>

        {/* Interactive Skill Nodes placed along the wave */}
        <div className="absolute inset-0 flex items-center px-4 sm:px-8">
          <div className="relative w-full h-full">
            {mappedNodes.map((node) => {
              const leftPercent = `${node.positionRatio * 100}%`;
              // Vertical harmonic placement based on index alternation
              const topOffset = 50 + Math.sin(node.index * 1.4) * 22;

              const isMastered = node.status === "mastered";
              const isLearning = node.status === "learning";
              const isMarketplaceGap = node.status === "marketplace_gap";

              let haloColor = "border-paper/20 text-paper/40 bg-ink-3";
              let dotColor = "bg-paper/40";
              let statusLabel = "Missing Native";

              if (isMastered) {
                haloColor = "border-accent text-accent bg-accent/15 shadow-[0_0_12px_rgba(217,246,90,0.5)]";
                dotColor = "bg-accent";
                statusLabel = node.isPackUnlocked ? "Studio Plugin" : "Resonant (Solved)";
              } else if (isLearning) {
                haloColor = "border-[#e6bd77] text-[#e6bd77] bg-[#e6bd77]/15 shadow-[0_0_8px_rgba(230,189,119,0.3)]";
                dotColor = "bg-[#e6bd77]";
                statusLabel = "Dampened (In Progress)";
              } else if (isMarketplaceGap) {
                haloColor = "border-[#ff637d] text-[#ff637d] bg-[#ff637d]/15 shadow-[0_0_10px_rgba(255,99,125,0.4)] animate-pulse";
                dotColor = "bg-[#ff637d]";
                statusLabel = "Ghost Gap (In Rack)";
              }

              const isSelected = activeNode?.id === node.id;

              return (
                <div
                  key={node.id}
                  style={{
                    left: leftPercent,
                    top: `${topOffset}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className="absolute z-10"
                >
                  {/* Interactive Button */}
                  <button
                    type="button"
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`group relative flex flex-col items-center focus:outline-none transition-transform duration-200 ${
                      isSelected ? "scale-125 z-20" : "hover:scale-115"
                    }`}
                  >
                    {/* Note name pill on hover/active */}
                    <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-paper/70 bg-ink/90 px-1 rounded border border-paper/10 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {saptakMode ? node.saptakData.note : node.saptakData.western}
                    </span>

                    {/* Outer Glowing Ring */}
                    <div
                      className={`grid h-7 w-7 place-items-center rounded-full border transition-all ${haloColor} ${
                        isSelected ? "ring-2 ring-accent" : ""
                      }`}
                    >
                      {/* Inner Vibrating Core */}
                      <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                    </div>

                    {/* Skill Label Below */}
                    <span
                      className={`mt-1 max-w-[85px] truncate text-center font-mono text-[8px] tracking-tight transition-colors ${
                        isMastered
                          ? "text-accent font-bold"
                          : isMarketplaceGap
                          ? "text-[#ff637d] font-semibold"
                          : "text-paper/70"
                      }`}
                    >
                      {node.name}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Saptak Notes Sub-bar along bottom */}
        <div className="absolute bottom-1.5 left-4 right-4 flex justify-between pointer-events-none font-mono text-[8px] text-paper/30">
          {SAPTAK_FREQUENCIES.map((s) => (
            <span key={s.note} className="opacity-60">
              {saptakMode ? `${s.note} (${s.name})` : `${s.western} (${Math.round(s.freq)}Hz)`}
            </span>
          ))}
        </div>
      </div>

      {/* Acoustic Frequency Legend & Details Bar */}
      <div className="grid gap-3 pt-2 sm:grid-cols-3">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] text-paper/60 border-r border-paper/10 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-paper">Resonant (Solved/Active)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#e6bd77]" />
            <span className="text-paper">Dampened (In Progress)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#ff637d] animate-pulse" />
            <span className="text-[#ff637d]">Ghost Gap (Plugin Rack)</span>
          </div>
        </div>

        {/* Active Node Detail Card */}
        <div className="sm:col-span-2 flex items-center justify-between rounded-[3px] border border-paper/10 bg-ink-3 px-3.5 py-2">
          {activeNode ? (
            <div className="flex items-center justify-between w-full gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-accent uppercase">
                    {activeNode.name}
                  </span>
                  <span className="font-mono text-[8px] text-paper/40">
                    {saptakMode
                      ? `${activeNode.saptakData.note} · ${activeNode.saptakData.name}`
                      : `${activeNode.saptakData.western} · ${activeNode.frequency}Hz`}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-paper/60">
                  {activeNode.status === "mastered"
                    ? activeNode.isPackUnlocked
                      ? `Studio Plugin Pack unlocked and verified.`
                      : `Mastered with ${activeNode.solvedCount} verified test passes.`
                    : activeNode.status === "learning"
                    ? `${activeNode.solvedCount}/${activeNode.totalCount} challenges completed.`
                    : activeNode.status === "marketplace_gap"
                    ? `External ecosystem skill: Available as an add-on pack in The Plugin Rack.`
                    : `No native challenges found.`}
                </p>
              </div>

              {activeNode.status === "marketplace_gap" ? (
                <button
                  type="button"
                  onClick={() => onOpenMarketplace && onOpenMarketplace(activeNode.marketplacePack || activeNode.name)}
                  className="shrink-0 rounded-[3px] bg-[#ff637d] px-3 py-1 font-mono text-[9px] font-bold text-ink hover:opacity-90 transition-opacity"
                >
                  Inspect in Rack →
                </button>
              ) : activeNode.uncompleted?.length > 0 ? (
                <button
                  type="button"
                  onClick={() => onSelectChallenge && onSelectChallenge(activeNode.uncompleted[0])}
                  className="shrink-0 rounded-[3px] bg-accent px-3 py-1 font-mono text-[9px] font-bold text-ink hover:opacity-90 transition-opacity"
                >
                  Strike Drill →
                </button>
              ) : null}
            </div>
          ) : (
            <p className="font-mono text-[9px] text-paper/40 italic">
              Click any node on the waveform to inspect acoustic frequency and challenge requirements.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
