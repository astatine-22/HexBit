import { createChatCompletion, isGroqConfigured } from "../../lib/groqClient";

const PRESETS = {
  "preset:backend": {
    jobTitle: "Backend Infrastructure Engineer",
    company: "Stripe",
    requiredSkills: ["Python", "SQL", "REST APIs", "Data Structures", "Algorithms"],
    niceToHaveSkills: ["Go", "Docker", "Distributed Systems"],
    coreConcepts: ["Concurrency", "Hash Maps", "Idempotency", "Database Transactions"],
  },
  "preset:frontend": {
    jobTitle: "Senior Frontend Engineer",
    company: "Vercel",
    requiredSkills: ["TypeScript", "JavaScript", "React", "Algorithms", "DOM"],
    niceToHaveSkills: ["Next.js", "Tailwind CSS", "Web Workers"],
    coreConcepts: ["State Management", "Async/Await", "Event Loop", "Closures"],
  },
  "preset:systems": {
    jobTitle: "Systems Platform Engineer",
    company: "Cloudflare",
    requiredSkills: ["Rust", "C++", "Memory Management", "Concurrency", "Linux"],
    niceToHaveSkills: ["WebAssembly", "Networking", "Kernel"],
    coreConcepts: ["Pointers", "Thread Safety", "Zero-Copy", "Bitwise Operations"],
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobText } = req.body || {};
  const cleanInput = typeof jobText === "string" ? jobText.trim() : "";

  if (!cleanInput) {
    return res.status(400).json({ error: "Job description text is required" });
  }

  // 1. Instant Preset Matching
  if (PRESETS[cleanInput.toLowerCase()]) {
    return res.status(200).json(PRESETS[cleanInput.toLowerCase()]);
  }

  // 2. Fallback if Groq is not configured
  if (!isGroqConfigured()) {
    return res.status(200).json({
      jobTitle: "Software Engineer",
      company: "Technology Company",
      requiredSkills: ["Python", "JavaScript", "Data Structures", "Algorithms"],
      niceToHaveSkills: ["SQL", "Git"],
      coreConcepts: ["Loops", "Recursion", "Problem Solving"],
    });
  }

  // 3. Groq AI Extraction
  const systemPrompt =
    'You are an expert technical recruiter and software architect. Analyze the provided job posting text and extract the technical requirements as a strict JSON object with these exact keys:\n{\n  "jobTitle": string (e.g. "Junior Backend Engineer"),\n  "company": string (e.g. "Stripe" or "Tech Startup"),\n  "requiredSkills": array of 4-6 primary programming languages, frameworks, or core CS topics,\n  "niceToHaveSkills": array of 2-4 secondary or bonus skills,\n  "coreConcepts": array of 3 algorithmic or architectural patterns mentioned (e.g. "Recursion", "REST APIs", "Hash Maps", "Concurrency")\n}\nOutput ONLY valid parseable JSON. No markdown backticks, no explanations.';

  try {
    const rawOutput = await createChatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Job posting text:\n${cleanInput.slice(0, 4000)}` },
      ],
      temperature: 0.2,
      maxTokens: 500,
      model: "qwen/qwen3.8-27b",
    });

    const sanitized = rawOutput
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(sanitized);

    return res.status(200).json({
      jobTitle: String(parsed.jobTitle || "Software Engineer"),
      company: String(parsed.company || "Target Company"),
      requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills.map(String) : ["Python", "Data Structures"],
      niceToHaveSkills: Array.isArray(parsed.niceToHaveSkills) ? parsed.niceToHaveSkills.map(String) : ["SQL", "Git"],
      coreConcepts: Array.isArray(parsed.coreConcepts) ? parsed.coreConcepts.map(String) : ["Algorithms", "Problem Solving"],
    });
  } catch (error) {
    console.error("Job extraction error:", error?.message);
    // Graceful fallback heuristics
    return res.status(200).json({
      jobTitle: "Software Developer",
      company: "Company",
      requiredSkills: ["Python", "JavaScript", "Data Structures", "Algorithms"],
      niceToHaveSkills: ["SQL", "Git"],
      coreConcepts: ["Algorithms", "Conditionals", "Functions"],
    });
  }
}
