import { createChatCompletion, isGroqConfigured } from "../../lib/groqClient";
import challenges from "../../data/challenges.json";
import fallbackHints, { DEFAULT_FALLBACK_HINT } from "../../lib/fallbackHints";

const MAX_HINT_TOKENS = 150;
const MAX_HINT_CHARS = 600;
const MAX_HISTORY_MESSAGES = 6;

// How direct the hint should be, scaled by how many times the user has tried.
const TIER_RULES = {
  1: "Ask a vague, guiding question only — point at the general idea or tool they should think about. Do not include code, and do not hand them the answer.",
  2: "Ask a clearer guiding question: name the approach or the likely mistake area and mention the relevant built-in functions to consider, but do not include code or hand them the answer.",
  3: "Ask nearly guiding questions: describe the exact steps they should reason through to notice the bug themselves, and you may include one short line of code for them to think about — but do not hand them the fix.",
  4: "Give a direct nudge: describe the exact steps to fix the problem, and you may include one short line of code if it helps.",
};

// Keyword fingerprints per challenge slug, used to pick a pre-written fallback
// hint when the request has no explicit slug and Groq is unreachable.
const SLUG_KEYWORDS = {
  "reverse-string": ["reverse", "reversed", "olleh"],
  fizzbuzz: ["fizz", "buzz"],
  "palindrome-check": ["palindrome", "racecar"],
  "count-vowels": ["vowel"],
  "sum-even-numbers": ["even"],
  "two-sum": ["two sum", "two-sum", "target"],
  factorial: ["factorial"],
};

const GENERIC_HINT =
  "Re-read the challenge description and the expected output, then test your logic with a tiny input first. Adding a console.log checkpoint inside your loop usually shows exactly where the output starts to drift.";

function tierFor(attemptCount) {
  return Math.min(Math.max(attemptCount, 1), 4);
}

function buildSystemPrompt(tier, language) {
  return [
    `You are HexBit's coding mentor, helping a beginner with a small ${language || "programming"} challenge.`,
    `The student is on attempt ${tier} of this hint ladder, so follow this style: ${TIER_RULES[tier]}`,
    "Rules:",
    "- Reply with ONLY the hint text: 1-3 short sentences of plain prose.",
    "- Prefer the Socratic method: ask ONE short guiding question that leads the student to notice it themselves. Only give a direct answer when the attempt tier is 4 or higher.",
    "- Never restate or quote their error message back at them.",
    "- Never reveal a complete working solution.",
    "- Be warm and encouraging, like a mentor who believes they can figure it out.",
  ].join(" ");
}

function buildUserPrompt({ challengeDescription, userCode, errorMessage, tier }) {
  return [
    `Challenge: ${challengeDescription}`,
    `Their current code:\n${userCode || "(they haven't written anything yet)"}`,
    errorMessage
      ? `Their program failed with this message:\n${errorMessage}`
      : "Their program runs, but the output does not match the expected output yet.",
    `Give a level ${tier} hint now.`,
  ].join("\n");
}

function inferSlug(challengeDescription) {
  const text = String(challengeDescription).toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const [slug, keywords] of Object.entries(SLUG_KEYWORDS)) {
    const score = keywords.reduce(
      (hits, keyword) => hits + (text.includes(keyword) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      best = slug;
      bestScore = score;
    }
  }

  return best;
}

function pickFallbackHint(slug, challengeDescription) {
  return fallbackHints[slug || inferSlug(challengeDescription)] || DEFAULT_FALLBACK_HINT;
}

function stripCodeFences(text) {
  const trimmed = String(text ?? "").trim();
  const fenced = trimmed.match(/^```[^\n]*\n([\s\S]*?)\n?```$/);
  return (fenced ? fenced[1] : trimmed).trim();
}

function parseBody(body) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const challengeDescription =
    typeof body.challengeDescription === "string"
      ? body.challengeDescription.trim()
      : "";
  const action = typeof body.action === "string" ? body.action : "";
  const snippet = typeof body.snippet === "string" ? body.snippet.slice(0, 4000) : "";

  if (!challengeDescription && !(action === "complete_snippet" && snippet.trim())) {
    return null;
  }

  const attemptNumber = Number(body.attemptCount);
  const attemptCount = Number.isFinite(attemptNumber)
    ? Math.min(Math.max(Math.trunc(attemptNumber), 1), 99)
    : 1;

  const rawHistory = Array.isArray(body.conversationHistory) ? body.conversationHistory : [];
  const conversationHistory = rawHistory
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));

  return {
    challengeDescription,
    userCode: typeof body.userCode === "string" ? body.userCode.slice(0, 4000) : "",
    errorMessage:
      typeof body.errorMessage === "string" ? body.errorMessage.slice(0, 1000) : "",
    attemptCount,
    slug: typeof body.slug === "string" ? body.slug : "",
    language: typeof body.language === "string" ? body.language.slice(0, 40) : "",
    action,
    snippet,
    conversationHistory,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      hint: "This endpoint gives hints via POST. Send { challengeDescription, userCode, errorMessage, attemptCount, conversationHistory? } and try again.",
    });
  }

  const parsed = parseBody(req.body);

  if (!parsed) {
    return res.status(400).json({
      hint: "Start by describing the challenge in your own words — what should your program print? Then ask for a hint again.",
    });
  }

  const { challengeDescription, userCode, errorMessage, attemptCount, slug, language, conversationHistory, action, snippet } = parsed;
  const tier = tierFor(attemptCount);

  if (action === "complete_snippet") {
    if (!snippet.trim()) {
      return res
        .status(400)
        .json({ completedSnippet: null, error: "Select some code to complete first." });
    }

    if (!isGroqConfigured()) {
      return res
        .status(503)
        .json({ completedSnippet: null, error: "AI is not configured on this server." });
    }

    try {
      const completed = await createChatCompletion({
        messages: [
          {
            role: "system",
            content:
              "You are a precise code completion engine. Return ONLY the completed replacement code for the selected snippet. No markdown fences, no commentary.",
          },
          {
            role: "user",
            content: [
              `Challenge: ${challengeDescription || "(not provided)"}`,
              `Language: ${language || "unknown"}`,
              `Full file so far:\n${userCode || "(empty)"}`,
              `Selected snippet to complete:\n${snippet}`,
              "Complete the unfinished logic in the selected snippet. Return only the replacement text for that snippet, preserving its indentation. Do not repeat the rest of the file. Do not wrap the answer in markdown.",
            ].join("\n\n"),
          },
        ],
        maxTokens: 700,
        temperature: 0.2,
      });

      return res.status(200).json({ completedSnippet: stripCodeFences(completed) });
    } catch (error) {
      console.error("Groq snippet completion failed:", error.message);
      return res.status(502).json({
        completedSnippet: null,
        error: "The AI could not complete that snippet. Try again.",
      });
    }
  }

  // No key configured — go straight to the pre-written hint.
  if (!isGroqConfigured()) {
    console.error("GROQ_API_KEY is not set; using fallback hint.");
    return res.status(200).json({ hint: pickFallbackHint(slug, challengeDescription) });
  }

  const messages = [
    { role: "system", content: buildSystemPrompt(tier, language) },
    ...parsed.conversationHistory.map((m) => ({ role: m.role, content: m.content })),
    {
      role: "user",
      content: buildUserPrompt({ challengeDescription, userCode, errorMessage, tier }),
    },
  ];

  try {
    const hint = await createChatCompletion({
      messages,
      maxTokens: MAX_HINT_TOKENS,
      temperature: 0.5,
    });

    return res.status(200).json({ hint: hint.slice(0, MAX_HINT_CHARS) });
  } catch (error) {
    console.error("Groq hint request failed; using fallback hint:", error.message);

    return res.status(200).json({ hint: pickFallbackHint(slug, challengeDescription) });
  }
}
