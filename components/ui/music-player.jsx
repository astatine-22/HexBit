"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function MusicPlayer({
  className,
  src,
  coverArt,
  autoPlay = false,
  isPlaying: externalIsPlaying,
  onTogglePlay,
  trackTitle = "Liner Notes · Track A",
  artist = "CodeMentor Studio",
  ...props
}) {
  const [internalIsPlaying, setInternalIsPlaying] = useState(autoPlay);
  const audioRef = useRef(null);

  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalIsPlaying;

  useEffect(() => {
    if (externalIsPlaying !== undefined) return;
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setInternalIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, externalIsPlaying]);

  const togglePlay = () => {
    if (onTogglePlay) {
      onTogglePlay(!isPlaying);
    } else {
      setInternalIsPlaying(!isPlaying);
    }
  };

  return (
    <div
      className={cn("relative inline-flex flex-col items-center select-none", className)}
      {...props}
    >
      {src && (
        <audio
          ref={audioRef}
          src={src}
          onEnded={() => {
            if (onTogglePlay) onTogglePlay(false);
            else setInternalIsPlaying(false);
          }}
          className="hidden"
        />
      )}

      <div
        className="relative cursor-pointer select-none h-44 w-44 sm:h-56 sm:w-56"
        onClick={togglePlay}
        title={isPlaying ? "Click to Pause Vinyl" : "Click to Spin Vinyl"}
      >
        {/* Tonearm */}
        <motion.div
          className="absolute z-20 top-[-6%] right-[-12%] origin-top-right w-[60%] h-[15%] pointer-events-none"
          initial={{ rotate: 12 }}
          animate={{ rotate: isPlaying ? -18 : 12 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Tonearm base */}
          <div className="absolute top-0 right-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#2a2c24] shadow-md transform translate-x-1/2 -translate-y-1/2 border-2 border-accent/40 z-10" />
          {/* Tonearm wand & Needle */}
          <div className="absolute top-0 right-[8px] sm:right-[12px] w-[90%] h-2 bg-paper/60 rounded-full origin-right -rotate-12 shadow-sm flex items-center justify-start">
            {/* Needle cartridge with neon accent */}
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-accent rounded-sm shadow-md transform -translate-x-1/2 border border-black/60" />
          </div>
        </motion.div>

        {/* Record Disc */}
        <div
          className={cn(
            "relative w-full h-full rounded-full border-4 border-paper/10 shadow-2xl overflow-hidden shadow-black/80 bg-[#12130e]"
          )}
          style={{
            animation: "spin 4s linear infinite",
            animationPlayState: isPlaying ? "running" : "paused",
          }}
        >
          {/* Album Cover Background / Art */}
          {coverArt ? (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-85 transition-opacity"
              style={{ backgroundImage: `url(${coverArt})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c14] via-[#10110d] to-[#1e2017]" />
          )}

          {/* Grooves Overlay (Microgroove concentric vinyl rings) */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, transparent 20%, rgba(0,0,0,0.5) 21%, transparent 22%, transparent 35%, rgba(0,0,0,0.6) 36%, transparent 37%, transparent 50%, rgba(0,0,0,0.4) 51%, transparent 52%, transparent 65%, rgba(0,0,0,0.7) 66%, transparent 67%, transparent 80%, rgba(0,0,0,0.5) 81%, transparent 82%)",
            }}
          />

          {/* Vinyl Glare Sheen Reflection */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 40%, transparent 60%, rgba(217,246,90,0.15) 100%)",
            }}
          />

          {/* Center Record Label Area */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-[#171912] border-2 border-accent/40 shadow-inner flex flex-col items-center justify-center p-1 text-center">
            <span className="font-mono text-[7px] font-bold uppercase tracking-wider text-accent truncate max-w-full">
              HEXBIT
            </span>
            <span className="font-mono text-[5px] uppercase tracking-tight text-paper/50">
              33⅓ RPM
            </span>
            {/* Spindle hole */}
            <div className="mt-0.5 w-2.5 h-2.5 rounded-full bg-[#0a0b08] border border-paper/40 shadow-inner" />
          </div>
        </div>
      </div>

      {/* Track Label */}
      <div className="mt-3 text-center">
        <p className="font-mono text-[10px] uppercase tracking-wider text-paper font-semibold">
          {trackTitle}
        </p>
        <p className="font-mono text-[8px] text-accent tracking-widest mt-0.5">
          {isPlaying ? "▶ SPINNING ON TURNTABLE" : "⏸ NEEDLE RESTING"}
        </p>
      </div>
    </div>
  );
}

export default MusicPlayer;
