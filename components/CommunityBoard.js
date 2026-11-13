"use client";

import { useState } from "react";
import { ArrowRight } from "@/components/icons";

const CHANNELS = ["#python", "#javascript", "#algorithms", "#projects", "#career"];

const POSTS = [
  { id: 1, title: "How to reverse a string in Python?", tag: "#python", body: "I tried s[::-1] but want to understand why.", upvotes: 12, status: "Solved" },
  { id: 2, title: "FizzBuzz edge cases", tag: "#algorithms", body: "What about 0 and negative numbers?", upvotes: 5, status: "Open" },
];

export default function CommunityBoard() {
  const [channel, setChannel] = useState("#python");
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");

  const filtered = POSTS.filter((p) => (channel === "all" ? true : p.tag === channel));

  return (
    <div className="space-y-6">
      <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
          Community forum
        </p>
        <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-[1] tracking-[-0.03em]">
          Doubts & <span className="italic text-accent">discussion.</span>
        </h1>
      </section>

      <div className="flex flex-wrap gap-2">
        {["all", ...CHANNELS].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setChannel(c)}
            className={`rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
              channel === c ? "border-accent bg-accent/10 text-accent" : "border-paper/10 text-paper/60 hover:border-accent/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Auto-suggest search */}
      <div className="rounded-[3px] border border-paper/10 bg-ink-2 p-4">
        <input
          type="text"
          placeholder="Search solved doubts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-[3px] border border-paper/15 bg-ink-3 px-3.5 py-2.5 text-[13px] text-paper placeholder:text-paper/30 focus:border-accent/60 focus:outline-none"
        />
        {query ? (
          <p className="mt-2 font-mono text-[9px] text-paper/40">
            {POSTS.filter((p) => p.title.toLowerCase().includes(query.toLowerCase())).length} matches
          </p>
        ) : null}
      </div>

      {/* New post */}
      <div className="rounded-[3px] border border-paper/10 bg-ink-2 p-4">
        <input
          type="text"
          placeholder="Question title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-[3px] border border-paper/15 bg-ink-3 px-3.5 py-2.5 text-[13px] text-paper placeholder:text-paper/30 focus:border-accent/60 focus:outline-none"
        />
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[11px] font-semibold text-ink"
        >
          Post doubt
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Feed */}
      <ul className="space-y-3">
        {filtered.map((p) => (
          <li key={p.id} className="rounded-[3px] border border-paper/10 bg-ink-2 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded-full border border-paper/10 bg-ink-3 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-paper/50">
                  {p.tag}
                </span>
                <h3 className="mt-2 text-[14px] font-medium">{p.title}</h3>
                <p className="mt-1 text-[12px] text-paper/60">{p.body}</p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] ${
                  p.status === "Solved"
                    ? "border-[#8fe0b7]/30 text-[#8fe0b7]"
                    : "border-[#ee917c]/30 text-[#ee917c]"
                }`}
              >
                {p.status}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-4 font-mono text-[9px] text-paper/40">
              <span>▲ {p.upvotes}</span>
              <span>Best answer · +10 rep</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
