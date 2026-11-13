"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getChallenges } from "@/lib/challenges";
import { getSolvedChallengeIds } from "@/lib/progress";
import { verifyJobMatch } from "@/lib/jobMatcher";
import { isVoiceRecordingSupported, startRecording, stopRecording, cancelRecording } from "@/lib/voiceRecorder";

const PRESETS = [
  {
    id: "preset:backend",
    label: "⚡ Try Stripe Backend",
    role: "Stripe Backend Infrastructure",
    sampleText: `Role: Backend Infrastructure Engineer
Company: Stripe
Requirements:
- 3+ years writing clean, reliable code in Python, Go, or Java.
- Deep understanding of Data Structures and algorithmic problem solving.
- Experience designing scalable REST APIs and handling concurrent transactions.
- Strong SQL and database modeling fundamentals.
- Nice to have: Distributed Systems, Docker containerization.`,
  },
  {
    id: "preset:frontend",
    label: "⚡ Try Vercel Fullstack",
    role: "Vercel Frontend Platform",
    sampleText: `Role: Senior Frontend Engineer
Company: Vercel
Requirements:
- Advanced proficiency with TypeScript and modern JavaScript.
- Mastery of React components, state management, and DOM optimization.
- Strong CS foundations in Algorithms, closures, and async event loops.
- Nice to have: Next.js App Router, Tailwind CSS, Web Workers.`,
  },
  {
    id: "preset:systems",
    label: "⚡ Try Cloudflare Systems",
    role: "Cloudflare Edge Systems",
    sampleText: `Role: Systems Platform Engineer
Company: Cloudflare
Requirements:
- Fluency in Rust or C++ for low-latency systems.
- Deep comprehension of Memory Management, raw pointers, and thread safety.
- Hands-on concurrency, async runtimes, and Linux networking.
- Nice to have: WebAssembly, eBPF, network socket programming.`,
  },
];

export default function JobMatcherBoard() {
  const { user } = useAuth();
  const [jobText, setJobText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parsedJob, setParsedJob] = useState(null);
  const [allChallenges, setAllChallenges] = useState([]);
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [customSkillInput, setCustomSkillInput] = useState("");

  // Interview Simulation State
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [interviewQuestion, setInterviewQuestion] = useState("");
  const [interviewAudioState, setInterviewAudioState] = useState("idle"); // idle | recording | analyzing | speaking
  const [interviewTranscript, setInterviewTranscript] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState("");
  const [interviewQuestionAudio, setInterviewQuestionAudio] = useState(null);
  const audioPlayerRef = useRef(null);

  // Load challenge bank & user's verified solved challenges
  useEffect(() => {
    let mounted = true;
    getChallenges().then((challenges) => {
      if (mounted) setAllChallenges(challenges || []);
    });
    const ids = getSolvedChallengeIds();
    setSolvedIds(new Set(ids));
    return () => {
      mounted = false;
      if (audioPlayerRef.current) {
        try { audioPlayerRef.current.pause(); } catch (e) {}
      }
      cancelRecording();
    };
  }, []);

  // Compute verified match results in real-time
  const matchResult = useMemo(() => {
    if (!parsedJob) return null;
    return verifyJobMatch(parsedJob, allChallenges, solvedIds);
  }, [parsedJob, allChallenges, solvedIds]);

  async function handleAnalyze(presetKey = null) {
    const textToSend = presetKey || jobText;
    if (!textToSend.trim()) {
      setError("Please paste a job description or click one of the quick presets.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/match-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobText: textToSend }),
      });

      if (!res.ok) {
        throw new Error(`Failed to extract requirements (${res.status})`);
      }

      const data = await res.json();
      setParsedJob(data);
    } catch (err) {
      setError(err?.message || "Could not parse job description.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPreset(preset) {
    setJobText(preset.sampleText);
    handleAnalyze(preset.id);
  }

  function handleRemoveSkill(skillName, isRequired) {
    if (!parsedJob) return;
    setParsedJob((prev) => {
      if (!prev) return prev;
      if (isRequired) {
        return {
          ...prev,
          requiredSkills: (prev.requiredSkills || []).filter((s) => s !== skillName),
        };
      } else {
        return {
          ...prev,
          niceToHaveSkills: (prev.niceToHaveSkills || []).filter((s) => s !== skillName),
        };
      }
    });
  }

  function handleAddCustomSkill(e) {
    e.preventDefault();
    const skill = customSkillInput.trim();
    if (!skill || !parsedJob) return;
    setParsedJob((prev) => ({
      ...prev,
      requiredSkills: [...new Set([...(prev.requiredSkills || []), skill])],
    }));
    setCustomSkillInput("");
  }

  // Voice Interview Simulation
  async function startMockInterview() {
    if (!parsedJob || !matchResult) return;
    setInterviewOpen(true);
    setInterviewFeedback("");
    setInterviewTranscript("");
    setInterviewAudioState("analyzing");

    const missingNames = [
      ...matchResult.evaluatedRequired.filter((s) => s.status === "missing").map((s) => s.name),
      ...matchResult.evaluatedNice.filter((s) => s.status === "missing").map((s) => s.name),
    ];

    const targetTopic = missingNames[0] || matchResult.evaluatedRequired[0]?.name || "Algorithms";

    try {
      const res = await fetch("/api/job-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_question",
          jobTitle: parsedJob.jobTitle,
          company: parsedJob.company,
          targetSkill: targetTopic,
        }),
      });

      const data = await res.json();
      const question = data?.question || `How would you approach solving a problem requiring ${targetTopic} in production?`;
      setInterviewQuestion(question);

      if (data?.audioUrl) {
        playTeacherVoice(data.audioUrl);
      } else {
        setInterviewAudioState("idle");
      }
    } catch (err) {
      setInterviewQuestion(`In ${parsedJob.jobTitle} roles at ${parsedJob.company}, how do you ensure high reliability and clean code structure?`);
      setInterviewAudioState("idle");
    }
  }

  function playTeacherVoice(url) {
    if (audioPlayerRef.current) {
      try { audioPlayerRef.current.pause(); } catch (e) {}
    }
    const audio = new Audio(url);
    audioPlayerRef.current = audio;
    setInterviewAudioState("speaking");
    audio.onended = () => {
      setInterviewAudioState("idle");
    };
    audio.onerror = () => {
      setInterviewAudioState("idle");
    };
    audio.play().catch(() => setInterviewAudioState("idle"));
  }

  async function handleToggleInterviewRecording() {
    if (interviewAudioState === "speaking") {
      if (audioPlayerRef.current) {
        try { audioPlayerRef.current.pause(); } catch (e) {}
      }
      setInterviewAudioState("idle");
      return;
    }

    if (interviewAudioState === "recording") {
      setInterviewAudioState("analyzing");
      try {
        const { audioBase64, mimeType } = await stopRecording();
        const res = await fetch("/api/job-interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "evaluate_answer",
            jobTitle: parsedJob.jobTitle,
            company: parsedJob.company,
            question: interviewQuestion,
            audioBase64,
            mimeType,
          }),
        });
        const data = await res.json();
        setInterviewTranscript(data?.transcript || "(Speech captured)");
        setInterviewFeedback(data?.feedback || "Great attempt! Keep practicing your fundamentals.");
        if (data?.audioUrl) {
          playTeacherVoice(data.audioUrl);
        } else {
          setInterviewAudioState("idle");
        }
      } catch (err) {
        setInterviewAudioState("idle");
        setInterviewFeedback("Could not analyze your audio answer. Please try speaking again.");
      }
      return;
    }

    if (interviewAudioState === "idle") {
      if (!isVoiceRecordingSupported()) {
        alert("Microphone is not supported in this browser.");
        return;
      }
      try {
        await startRecording();
        setInterviewAudioState("recording");
      } catch (e) {
        alert("Microphone permission required.");
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-[4px] border border-paper/10 bg-gradient-to-b from-[#191b15] to-[#12130e] p-6 lg:p-8">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-accent">
                The Audition
              </span>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-accent border border-accent/20">
                Verified Matcher
              </span>
            </div>
            <h1 className="mt-2 font-display text-[clamp(1.8rem,4vw,2.75rem)] leading-tight tracking-[-0.03em] text-paper">
              Job-Description Matcher
            </h1>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-paper/60">
              Paste any job posting. CodeMentor audits your verified test execution, completed pressings, and quiz accuracy — no self-reported checkboxes or resume fluff.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-paper/40 lg:inline">
              Instant Demo:
            </span>
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="rounded-full border border-paper/15 bg-ink-2 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-paper/75 transition-all hover:border-accent hover:text-accent hover:bg-accent/5"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Input Section */}
      <section className="rounded-[4px] border border-paper/10 bg-ink-2 p-5 lg:p-6">
        <label htmlFor="jobText" className="block font-mono text-[9px] uppercase tracking-[0.2em] text-paper/50">
          Paste Target Job Posting / Requirements
        </label>
        <textarea
          id="jobText"
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          rows={5}
          placeholder="Paste job posting text, responsibilities, and required tech stack here (e.g. from LinkedIn, Greenhouse, or Lever)..."
          className="mt-2.5 w-full rounded-[3px] border border-paper/15 bg-[#0e0f0c] p-3.5 font-mono text-[12px] leading-relaxed text-paper/90 placeholder-paper/25 focus:border-accent/60 focus:outline-none"
        />

        {error ? (
          <p className="mt-2 text-[12px] text-[#ee917c]">{error}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[9px] tracking-wider text-paper/40">
            {jobText.length > 0 ? `${jobText.length} characters ready for semantic extraction` : "Or click an instant demo preset above"}
          </p>

          <button
            type="button"
            onClick={() => handleAnalyze()}
            disabled={loading || !jobText.trim()}
            className="inline-flex items-center gap-2.5 rounded-full bg-accent px-5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-all hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                Analyzing Requirements…
              </>
            ) : (
              <>
                <span>⚡</span>
                Analyze My Readiness
              </>
            )}
          </button>
        </div>
      </section>

      {/* Matcher Results Hero */}
      {matchResult && parsedJob ? (
        <div className="space-y-6">
          {/* Hero Scorecard */}
          <section className="grid gap-4 rounded-[4px] border border-paper/10 bg-gradient-to-r from-ink-2 via-[#161812] to-ink-2 p-6 lg:grid-cols-[280px_1fr] lg:p-8">
            {/* Radial Match Meter */}
            <div className="flex flex-col items-center justify-center rounded-[4px] border border-paper/10 bg-ink-3/80 p-6 text-center">
              <div className="relative grid h-32 w-32 place-items-center">
                <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    className="stroke-paper/10"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke={matchResult.isReadyToApply ? "#7bddaa" : "#d9f65a"}
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={
                      2 * Math.PI * 50 - (matchResult.matchScore / 100) * (2 * Math.PI * 50)
                    }
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-display text-[34px] font-bold leading-none tracking-tight text-paper">
                    {matchResult.matchScore}%
                  </span>
                  <span className="mt-1 font-mono text-[7px] uppercase tracking-[0.24em] text-paper/40">
                    Job Match
                  </span>
                </div>
              </div>

              <div className="mt-4">
                {matchResult.isReadyToApply ? (
                  <span className="inline-block rounded-full border border-[#7bddaa]/40 bg-[#7bddaa]/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#7bddaa] shadow-sm shadow-[#7bddaa]/20">
                    🏆 Ready to Apply · Proof Verified
                  </span>
                ) : (
                  <span className="inline-block rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-accent">
                    ⚡ Almost Ready · {matchResult.playlistChallenges.length} Tracks to {matchResult.targetMatchScore}%
                  </span>
                )}
              </div>
            </div>

            {/* Target Role Overview & Practice CTA */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                    Audition Target
                  </span>
                  <span className="text-paper/30">/</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-paper/50">
                    {parsedJob.company}
                  </span>
                </div>
                <h2 className="mt-1 font-display text-[26px] tracking-[-0.02em] text-paper">
                  {parsedJob.jobTitle}
                </h2>
                <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-paper/60">
                  Calculated against your account telemetry: <span className="text-accent font-mono font-medium">{solvedIds.size} solved challenges</span>. 
                  Weights allocate 75% to core requirements and 25% to secondary tech stack.
                </p>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-3 border-t border-paper/10 pt-4">
                <button
                  type="button"
                  onClick={startMockInterview}
                  className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent/15 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent transition-all hover:bg-accent/25 hover:border-accent"
                >
                  <span>🎙️</span>
                  Practice 2-Min Voice Interview for this Role
                </button>

                <a
                  href="#sprint-playlist"
                  className="inline-flex items-center gap-2 rounded-full border border-paper/20 bg-paper/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper/70 hover:border-paper/40 hover:text-paper"
                >
                  <span>▶</span>
                  Jump to Gap Playlist ({matchResult.playlistChallenges.length} tracks)
                </a>
              </div>
            </div>
          </section>

          {/* Interactive Skills Matrix */}
          <section className="grid gap-6 lg:grid-cols-2">
            {/* Required Skills (75%) */}
            <div className="rounded-[4px] border border-paper/10 bg-ink-2 p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-paper">
                    Required Core Stack
                  </h3>
                  <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-accent">
                    75% Weight on Match Score
                  </p>
                </div>
                <span className="font-mono text-[9px] text-paper/40">
                  {matchResult.evaluatedRequired.filter((s) => s.status === "mastered").length} / {matchResult.evaluatedRequired.length} Mastered
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {matchResult.evaluatedRequired.map((skill) => (
                  <div
                    key={skill.name}
                    className="flex items-center justify-between rounded-[3px] border border-paper/10 bg-ink-3/90 p-3 transition-colors hover:border-paper/20"
                  >
                    <div className="flex items-center gap-2.5">
                      {skill.status === "mastered" ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7bddaa]/15 text-[10px] text-[#7bddaa]" title="Mastered">
                          ✓
                        </span>
                      ) : skill.status === "learning" ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-[10px] text-accent" title="In Progress">
                          ⚡
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ee917c]/15 text-[10px] text-[#ee917c]" title="Missing Gap">
                          ✕
                        </span>
                      )}
                      <div>
                        <span className="text-[13px] font-medium text-paper">
                          {skill.name}
                        </span>
                        <div className="font-mono text-[8px] text-paper/40 uppercase tracking-wider">
                          {skill.status === "mastered"
                            ? `✓ ${skill.solvedCount} Verified Pressings Solved`
                            : skill.status === "learning"
                              ? `⚡ ${skill.solvedCount} Solved · Needs ${3 - skill.solvedCount} more for mastery`
                              : `Unattempted in your library`}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill.name, true)}
                      title="Remove skill"
                      className="text-paper/20 hover:text-paper/60 px-1 font-mono text-[11px]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Skill Form */}
              <form onSubmit={handleAddCustomSkill} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  placeholder="+ Add another required skill..."
                  className="flex-1 rounded-[3px] border border-paper/15 bg-ink px-3 py-1.5 font-mono text-[10px] text-paper placeholder-paper/30 focus:border-accent/60 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!customSkillInput.trim()}
                  className="rounded-[3px] border border-paper/20 bg-paper/5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-paper/70 hover:border-accent hover:text-accent disabled:opacity-30"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Nice to Have & Core CS Concepts (25%) */}
            <div className="rounded-[4px] border border-paper/10 bg-ink-2 p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-paper">
                    Secondary & Core Concepts
                  </h3>
                  <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-paper/40">
                    25% Weight · Bonus Leverage
                  </p>
                </div>
                <span className="font-mono text-[9px] text-paper/40">
                  {matchResult.evaluatedNice.filter((s) => s.status === "mastered").length} / {matchResult.evaluatedNice.length} Mastered
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {matchResult.evaluatedNice.map((skill) => (
                  <div
                    key={skill.name}
                    className="flex items-center justify-between rounded-[3px] border border-paper/10 bg-ink-3/90 p-3 transition-colors hover:border-paper/20"
                  >
                    <div className="flex items-center gap-2.5">
                      {skill.status === "mastered" ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7bddaa]/15 text-[10px] text-[#7bddaa]">
                          ✓
                        </span>
                      ) : skill.status === "learning" ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-[10px] text-accent">
                          ⚡
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-paper/10 text-[10px] text-paper/40">
                          ○
                        </span>
                      )}
                      <div>
                        <span className="text-[13px] font-medium text-paper">
                          {skill.name}
                        </span>
                        <div className="font-mono text-[8px] text-paper/40 uppercase tracking-wider">
                          {skill.status === "mastered"
                            ? `✓ ${skill.solvedCount} Verified Solved`
                            : skill.status === "learning"
                              ? `⚡ ${skill.solvedCount} Solved`
                              : `Optional bonus skill`}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill.name, false)}
                      title="Remove skill"
                      className="text-paper/20 hover:text-paper/60 px-1 font-mono text-[11px]"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* Core Architecture Concepts */}
                {parsedJob.coreConcepts?.length > 0 && (
                  <div className="pt-2">
                    <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-paper/40 mb-2">
                      Key Architectural Concepts
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedJob.coreConcepts.map((concept) => (
                        <span
                          key={concept}
                          className="rounded-full border border-paper/15 bg-ink px-2.5 py-1 font-mono text-[9px] text-paper/70"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Curated Sprint Playlist Section */}
          <section id="sprint-playlist" className="rounded-[4px] border border-paper/10 bg-ink-2 p-6 lg:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paper/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                    The Curated Sprint
                  </span>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-accent">
                    ~{matchResult.estimatedMinutes} Mins Total
                  </span>
                </div>
                <h3 className="mt-1 font-display text-[22px] tracking-[-0.02em] text-paper">
                  Recommended Track Sequence to Reach {matchResult.targetMatchScore}%
                </h3>
                <p className="mt-1 text-[12px] text-paper/50">
                  Solve these {matchResult.playlistChallenges.length} uncompleted challenges to close your verified skill gaps for {parsedJob.company}.
                </p>
              </div>

              <span className="font-mono text-[10px] uppercase tracking-wider text-paper/40">
                Sorted by Difficulty (Easy → Medium)
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matchResult.playlistChallenges.map((challenge, idx) => (
                <div
                  key={challenge.id}
                  className="group relative flex flex-col justify-between rounded-[4px] border border-paper/12 bg-ink-3 p-4 transition-all hover:border-accent/60 hover:shadow-lg hover:shadow-accent/5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-[3px] border border-paper/15 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-accent">
                        Track {idx + 1}
                      </span>
                      <span className="font-mono text-[8px] uppercase tracking-wider text-paper/40">
                        {challenge.estimatedMinutes || 10}m
                      </span>
                    </div>

                    <h4 className="mt-2 text-[14px] font-semibold text-paper group-hover:text-accent transition-colors line-clamp-1">
                      {challenge.title}
                    </h4>

                    <div className="mt-1.5 flex items-center gap-2 font-mono text-[9px] text-paper/50">
                      <span className="capitalize">{challenge.language}</span>
                      <span>·</span>
                      <span className="capitalize text-paper/40">{challenge.difficulty}</span>
                    </div>

                    <p className="mt-2 text-[11px] leading-relaxed text-paper/50 line-clamp-2">
                      {challenge.description}
                    </p>

                    <div className="mt-3">
                      <span className="inline-block rounded-full border border-paper/10 bg-paper/5 px-2 py-0.5 font-mono text-[8px] text-paper/60">
                        Closes Gap: <span className="text-accent">{challenge.fillsSkill}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-paper/10">
                    <Link
                      href={`/challenges/${challenge.id}/solve`}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-paper/10 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-paper transition-all group-hover:bg-accent group-hover:text-ink"
                    >
                      Solve Now →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {/* Voice Interview Modal */}
      {interviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-[6px] border border-paper/20 bg-ink-2 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setInterviewOpen(false);
                if (audioPlayerRef.current) {
                  try { audioPlayerRef.current.pause(); } catch (e) {}
                }
                cancelRecording();
                setInterviewAudioState("idle");
              }}
              className="absolute right-4 top-4 text-paper/40 hover:text-paper text-[18px]"
            >
              ✕
            </button>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-accent">
                Audition Simulator
              </span>
              <span className="text-paper/30">·</span>
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-paper/50">
                {parsedJob?.company} Interviewer
              </span>
            </div>

            <h3 className="mt-1 font-display text-[20px] text-paper">
              Target Interview Question
            </h3>

            {/* Question Display */}
            <div className="mt-3 rounded-[4px] border border-paper/15 bg-ink p-4">
              <p className="text-[13px] leading-relaxed text-paper/90">
                &ldquo;{interviewQuestion || "Generating targeted question..."}&rdquo;
              </p>
            </div>

            {/* Speaking / Audio Animation */}
            {interviewAudioState === "speaking" && (
              <div className="mt-3 flex items-center gap-2 text-[11px] text-[#7bddaa]">
                <span className="flex items-end gap-0.5 h-3" aria-hidden="true">
                  <span className="h-2 w-0.5 animate-pulse bg-[#7bddaa]" />
                  <span className="h-3 w-0.5 animate-pulse bg-[#7bddaa] [animation-delay:120ms]" />
                  <span className="h-2.5 w-0.5 animate-pulse bg-[#7bddaa] [animation-delay:240ms]" />
                </span>
                Interviewer is asking question aloud... Click mic to interrupt or answer.
              </div>
            )}

            {/* Candidate Voice Transcript & Feedback */}
            {interviewTranscript ? (
              <div className="mt-3 space-y-2">
                <p className="text-[12px] text-paper/60">
                  <span className="font-mono text-[8px] uppercase tracking-wider text-paper/40">You said: </span>
                  {interviewTranscript}
                </p>
                {interviewFeedback ? (
                  <div className="rounded-[4px] border border-accent/30 bg-accent/10 p-3">
                    <span className="font-mono text-[8px] uppercase tracking-wider text-accent font-semibold">
                      Interviewer Feedback:
                    </span>
                    <p className="mt-1 text-[12px] leading-relaxed text-paper/85">
                      {interviewFeedback}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Recording Controls */}
            <div className="mt-6 flex items-center justify-between border-t border-paper/10 pt-4">
              <span className="font-mono text-[9px] uppercase tracking-wider text-paper/40">
                {interviewAudioState === "recording"
                  ? "● Recording your answer..."
                  : interviewAudioState === "analyzing"
                    ? "Evaluating response..."
                    : "Click mic to answer via voice"}
              </span>

              <button
                type="button"
                onClick={handleToggleInterviewRecording}
                disabled={interviewAudioState === "analyzing"}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider transition-all ${
                  interviewAudioState === "recording"
                    ? "bg-[#bf5741] text-white animate-pulse"
                    : interviewAudioState === "speaking"
                      ? "border border-[#7bddaa] bg-[#7bddaa]/10 text-[#7bddaa]"
                      : "bg-accent text-ink hover:opacity-90"
                }`}
              >
                {interviewAudioState === "recording" ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-white" />
                    Stop & Submit
                  </>
                ) : interviewAudioState === "speaking" ? (
                  <>Stop Audio</>
                ) : (
                  <>
                    <span>🎙️</span>
                    Answer with Voice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
