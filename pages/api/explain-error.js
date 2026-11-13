import { createChatCompletion, isGroqConfigured } from "../../lib/groqClient";

function stripCodeFences(text) {
  const trimmed = String(text ?? "").trim();
  const fenced = trimmed.match(/^```[^\n]*\n([\s\S]*?)\n?```$/);
  return (fenced ? fenced[1] : trimmed).trim();
}

const ERROR_PATTERNS = [
  {
    re: /undefined is not a function/i,
    explanation:
      "You're calling something that doesn't exist yet — check the name and spelling of the function you're calling.",
  },
  {
    re: /is not defined/i,
    explanation:
      "You're using a variable or function that hasn't been defined yet — check the name and spelling, and make sure it exists before you use it.",
  },
  {
    re: /cannot read propert/i,
    explanation:
      "You're trying to read a property of something that doesn't exist yet — check what you're accessing and whether it's the right kind of value.",
  },
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ explanation: "Use POST." });
  }

  const body = req.body;
  const rawError =
    body && typeof body.rawError === "string" ? body.rawError.trim() : "";
  const code = body && typeof body.code === "string" ? body.code.slice(0, 4000) : "";
  const action = body && typeof body.action === "string" ? body.action : "";
  const fixRequested = Boolean(body && body.fixRequested === true);
  const language = body && typeof body.language === "string" ? body.language.slice(0, 40) : "";
  const challengeDescription =
    body && typeof body.challengeDescription === "string"
      ? body.challengeDescription.slice(0, 1000)
      : "";

  const wantsFix = fixRequested && Boolean(code.trim());
  const wantsSnippetExplanation = action === "explain_snippet" && Boolean(code.trim());

  if (!rawError && !wantsFix && !wantsSnippetExplanation) {
    return res.status(400).json({ explanation: "Please send a rawError string." });
  }

  if (wantsFix || wantsSnippetExplanation) {
    if (!isGroqConfigured()) {
      return res.status(503).json(
        wantsFix
          ? { correctedSnippet: null, error: "AI is not configured on this server." }
          : { explanation: null, error: "AI is not configured on this server." }
      );
    }

    try {
      if (wantsFix) {
        const corrected = await createChatCompletion({
          messages: [
            {
              role: "system",
              content:
                "You are a precise code repair engine. Return ONLY the corrected replacement code for the selected snippet. No markdown fences, no commentary.",
            },
            {
              role: "user",
              content: [
                `Challenge: ${challengeDescription || "(not provided)"}`,
                `Language: ${language || "unknown"}`,
                `Selected snippet to repair:\n${code}`,
                "Fix any syntax or logical defects. Return only the corrected replacement for this snippet, preserving its indentation. If it is already correct, return it unchanged. Do not wrap the answer in markdown.",
              ].join("\n\n"),
            },
          ],
          maxTokens: 700,
          temperature: 0,
        });

        return res.status(200).json({ correctedSnippet: stripCodeFences(corrected) });
      }

      const explanation = await createChatCompletion({
        messages: [
          {
            role: "system",
            content:
              "You are a friendly coding tutor. Explain code in plain language a beginner would understand, with no jargon.",
          },
          {
            role: "user",
            content: [
              `Challenge: ${challengeDescription || "(not provided)"}`,
              `Language: ${language || "unknown"}`,
              `Selected snippet:\n${code}`,
              "In 2-4 short sentences, explain what this snippet does and whether it looks on track for the challenge. Plain prose only, no code fences.",
            ].join("\n\n"),
          },
        ],
        maxTokens: 350,
        temperature: 0.2,
      });

      return res.status(200).json({ explanation });
    } catch (error) {
      console.error("Groq snippet assist failed:", error.message);
      return res.status(502).json(
        wantsFix
          ? { correctedSnippet: null, error: "The AI could not fix that snippet. Try again." }
          : { explanation: null, error: "The AI could not explain that snippet. Try again." }
      );
    }
  }

  const languageContext = language ? ` The code is written in ${language}.` : "";
  const userContent = `Explain this error in one plain sentence a beginner would understand, no jargon: ${rawError}${languageContext}`;

  try {
    const explanation = await createChatCompletion({
      messages: [
        {
          role: "system",
          content:
            "You are a friendly coding tutor. Explain errors in one plain sentence a beginner would understand, with no jargon.",
        },
        { role: "user", content: userContent },
      ],
      maxTokens: 60,
      temperature: 0,
    });

    return res.status(200).json({ explanation });
  } catch (error) {
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.re.test(rawError)) {
        return res.status(200).json({ explanation: pattern.explanation });
      }
    }
    return res.status(200).json({ explanation: rawError });
  }
}
