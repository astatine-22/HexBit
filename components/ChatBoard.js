"use client";

import { useState } from "react";

const CHANNELS = ["#general", "#python", "#javascript", "#help"];

const MESSAGES = [
  { id: 1, user: "Sanat", text: "Anyone solved the Rust Fibonacci level?", time: "10:24" },
  { id: 2, user: "Akshay", text: "Yeah, use iterative approach for large n.", time: "10:26" },
  { id: 3, user: "Ashevk", text: "Check the Liner Notes audio for intuition.", time: "10:28" },
];

export default function ChatBoard() {
  const [channel, setChannel] = useState("#general");
  const [input, setInput] = useState("");

  return (
    <div className="space-y-6">
      <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
          Community chat
        </p>
        <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-[1] tracking-[-0.03em]">
          Real-time <span className="italic text-accent">channels.</span>
        </h1>
      </section>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-1">
          {CHANNELS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              className={`w-full rounded-[3px] px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                channel === c ? "bg-accent/10 text-accent" : "text-paper/60 hover:bg-white/[0.03]"
              }`}
            >
              {c}
            </button>
          ))}
        </aside>

        <section className="flex flex-col rounded-[3px] border border-paper/10 bg-ink-2">
          <div className="flex-1 space-y-3 p-4">
            {MESSAGES.map((m) => (
              <div key={m.id} className="flex gap-3">
                <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-accent">
                  {m.user}
                </span>
                <p className="text-[12px] text-paper/70">{m.text}</p>
                <span className="ml-auto shrink-0 font-mono text-[8px] text-paper/30">
                  {m.time}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-paper/10 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Message ${channel}…`}
                className="flex-1 rounded-[3px] border border-paper/15 bg-ink-3 px-3.5 py-2 text-[13px] text-paper placeholder:text-paper/30 focus:border-accent/60 focus:outline-none"
              />
              <button
                type="button"
                className="rounded-full bg-accent px-4 py-2 text-[11px] font-semibold text-ink"
              >
                Send
              </button>
            </div>
            <p className="mt-2 font-mono text-[8px] text-paper/30">
              @mentions · markdown · code blocks · block/report available
            </p>
          </div>
        </section>
      </div>

      {/* Study session widget */}
      <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
          Peer study session
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <input type="date" className="rounded-[3px] border border-paper/15 bg-ink-3 px-3 py-2 text-[12px] text-paper focus:border-accent/60 focus:outline-none" />
          <select className="rounded-[3px] border border-paper/15 bg-ink-3 px-3 py-2 text-[12px] text-paper focus:border-accent/60 focus:outline-none">
            <option>Python</option>
            <option>JavaScript</option>
          </select>
          <button type="button" className="rounded-full border border-paper/20 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.16em] text-paper/70 hover:border-accent/50 hover:text-accent">
            Generate .ics
          </button>
        </div>
      </section>

      {/* Announcement banner */}
      <div className="rounded-[3px] border border-accent/30 bg-accent/10 px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
          Announcement · New Rust track released!
        </p>
      </div>
    </div>
  );
}
