"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ArrowRight, Check } from "@/components/icons";
import projects from "@/data/projects.json";

export default function ProjectsBoard() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(projects[0]);
  const [checked, setChecked] = useState({});
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const toggleCheck = (item) => {
    setChecked((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-paper/40">
          Guided projects
        </p>
        <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-[1] tracking-[-0.03em]">
          Build real <span className="italic text-accent">things.</span>
        </h1>
        <p className="mt-2 text-[13px] text-paper/50">
          Pick a project, follow the milestones, self-check, then showcase.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-2">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelected(p);
                setChecked({});
                setSubmitted(false);
                setShowSolution(false);
              }}
              className={`w-full rounded-[3px] border px-4 py-3 text-left transition-colors ${
                selected.id === p.id
                  ? "border-accent bg-accent/10 text-paper"
                  : "border-paper/10 text-paper/60 hover:border-accent/40"
              }`}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.16em]">
                {p.difficulty}
              </p>
              <p className="mt-1 text-[13px] font-medium">{p.title}</p>
              <p className="mt-0.5 font-mono text-[8px] text-paper/40">
                {p.language}
              </p>
            </button>
          ))}
        </aside>

        <section className="space-y-6">
          <div className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.05] tracking-[-0.02em]">
              {selected.title}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-paper/60">
              {selected.goal}
            </p>

            <div className="mt-6">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/40">
                Milestones
              </p>
              <ol className="mt-2 space-y-1.5">
                {selected.milestones.map((m, i) => (
                  <li key={i} className="flex items-center gap-2 text-[12px] text-paper/70">
                    <span className="font-mono text-[9px] text-accent">{pad(i + 1)}</span>
                    {m}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-6">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/40">
                Feature checklist
              </p>
              <div className="mt-2 space-y-2">
                {selected.checklist.map((item) => (
                  <label key={item} className="flex items-center gap-2.5 text-[12px] text-paper/70">
                    <input
                      type="checkbox"
                      checked={Boolean(checked[item])}
                      onChange={() => toggleCheck(item)}
                      className="h-3.5 w-3.5 rounded-[2px] border border-paper/30 bg-transparent accent-[#d9f65a]"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/40">
              Starter code
            </p>
            <pre className="mt-3 overflow-auto rounded-[3px] border border-paper/10 bg-ink-3 p-4 font-mono text-[11px] text-paper/80">
              {selected.starterCode}
            </pre>

            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.2em] text-paper/40">
              Self-check
            </p>
            <p className="mt-1 text-[12px] text-paper/60">
              Expected output:
            </p>
            <pre className="mt-2 overflow-auto rounded-[3px] border border-paper/10 bg-ink-3 p-4 font-mono text-[11px] text-accent/80">
              {selected.expectedOutput}
            </pre>

            <button
              type="button"
              onClick={() => setShowSolution((v) => !v)}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-paper/20 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.16em] text-paper/70 hover:border-accent/50 hover:text-accent"
            >
              {showSolution ? "Hide" : "Run tests & unlock solution"}
            </button>

            {showSolution ? (
              <pre className="mt-4 overflow-auto rounded-[3px] border border-accent/20 bg-ink-3 p-4 font-mono text-[11px] text-paper/80">
                {selected.solution}
              </pre>
            ) : null}
          </div>

          <div className="rounded-[3px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/40">
              Submit & showcase
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                type="url"
                placeholder="GitHub repo URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="rounded-[3px] border border-paper/15 bg-ink-3 px-3.5 py-2.5 text-[13px] text-paper placeholder:text-paper/30 focus:border-accent/60 focus:outline-none"
              />
              <input
                type="url"
                placeholder="Live demo URL"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                className="rounded-[3px] border border-paper/15 bg-ink-3 px-3.5 py-2.5 text-[13px] text-paper placeholder:text-paper/30 focus:border-accent/60 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              disabled={!repoUrl}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[12px] font-semibold text-ink disabled:opacity-40"
            >
              Submit & showcase
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            {submitted ? (
              <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[#8fe0b7]">
                Published to showcase · solution unlocked
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
