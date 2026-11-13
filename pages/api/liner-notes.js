import { createChatCompletion, isGroqConfigured } from "../../lib/groqClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ text: "" });
  }

  const body = req.body || {};
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : "this challenge";
  const language =
    typeof body.language === "string" && body.language.trim()
      ? body.language.trim()
      : "this language";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const category =
    typeof body.category === "string" && body.category.trim()
      ? body.category.trim()
      : "Coding Fundamentals";
  const experienceLevel =
    typeof body.experienceLevel === "string" ? body.experienceLevel.trim() : "beginner";

  const fallback = `Track ${title} in ${language}. The core idea is to break down the input into manageable steps before assembling the final output.`;

  if (!isGroqConfigured()) {
    return res.status(200).json({ text: fallback });
  }

  const analogyHint =
    experienceLevel === "advanced"
      ? "Focus on algorithmic trade-offs: pointers, cache locality, amortized time, and memory allocation."
      : "Use intuitive real-world analogies (e.g. turntable speeds, mixing boards, sorting records).";

  const systemPrompt =
    "You are a retro vinyl record producer and senior engineer providing 'Liner Notes' for a coding challenge. In 2 to 3 concise, spoken-friendly sentences, explain the conceptual intuition and real-world mental model behind the problem. Do NOT write code. Keep it engaging, punchy, and suitable for being read aloud. " +
    analogyHint;

  const userPrompt = `Challenge: "${title}"\nLanguage: ${language}\nCategory: ${category}\nDescription: ${description || "No description provided."}\n\nWrite the Liner Notes now.`;

  try {
    const text = await createChatCompletion({
      model: "qwen/qwen3.8-27b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 120,
      temperature: 0.6,
    });

    return res.status(200).json({ text: text || fallback });
  } catch (error) {
    return res.status(200).json({ text: fallback });
  }
}
