import { createChatCompletion } from "../../lib/groqClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ summary: "Keep going — you've got this!" });
  }

  const body = req.body;
  const challengeTitle =
    body && typeof body.challengeTitle === "string" ? body.challengeTitle : "";
  const attemptNumber = Number(body?.attemptCount);
  const attemptCount = Number.isFinite(attemptNumber)
    ? Math.max(1, Math.trunc(attemptNumber))
    : 1;
  const errorHistory = Array.isArray(body?.errorHistory)
    ? body.errorHistory.filter((e) => typeof e === "string")
    : [];

  const fallbackSummary = `Nice work — you solved it in ${attemptCount} attempts!`;

  try {
    const summary = await createChatCompletion({
      messages: [
        {
          role: "system",
          content:
            "You are a friendly coding mentor. Write a short encouraging summary of what the fix likely was.",
        },
        {
          role: "user",
          content: `Challenge: ${challengeTitle}. The student solved this challenge on attempt ${attemptCount}. Based on this error history: ${errorHistory.join("; ") || "n/a"}. Give a 1-2 sentence encouraging summary of what the fix likely was, referencing the attempt count.`,
        },
      ],
      maxTokens: 120,
      temperature: 0.7,
    });

    return res.status(200).json({ summary });
  } catch (error) {
    return res.status(200).json({ summary: fallbackSummary });
  }
}
