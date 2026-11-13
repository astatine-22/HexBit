import { createChatCompletion, isGroqConfigured } from "../../lib/groqClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      score: null,
      feedback: "This endpoint only accepts POST requests.",
    });
  }

  const body = req.body || {};
  const challengeTitle = typeof body.challengeTitle === "string" ? body.challengeTitle : "Challenge";
  const challengeDescription = typeof body.challengeDescription === "string" ? body.challengeDescription : "";
  const chapter = typeof body.category === "string" ? body.category : "Coding Fundamentals";
  const language = typeof body.language === "string" && body.language.trim() ? body.language.trim() : "this programming language";

  const userQuery =
    typeof body.approach === "string" && body.approach.trim()
      ? body.approach.trim()
      : typeof body.message === "string" && body.message.trim()
        ? body.message.trim()
        : typeof body.userCode === "string" && body.userCode.trim()
          ? body.userCode.trim()
          : "";

  if (!userQuery) {
    return res.status(200).json({
      score: null,
      feedback: `Ask me anything about your approach, algorithm, or syntax in ${language} for the "${challengeTitle}" challenge.`,
    });
  }

  if (!isGroqConfigured()) {
    return res.status(200).json({
      score: null,
      feedback: `[Offline Mode] Your approach query for ${language}: "${userQuery.slice(0, 80)}...". Set GROQ_API_KEY in .env.local for full interactive AI chat.`,
    });
  }

  const systemPrompt = `You are CodeMentor, an expert, encouraging, and strictly focused AI coding tutor.

CURRENT LEARNING CONTEXT:
- Challenge: "${challengeTitle}"
- Chapter / Concept: ${chapter}
- Programming Language: ${language.toUpperCase()}
${challengeDescription ? `- Challenge Description: ${challengeDescription}` : ""}

STRICT OPERATING GUARDRAILS (NEVER VIOLATE THESE RULES):
1. STRICT CODING-ONLY: You must ONLY answer questions directly about programming, computer science, algorithms, debugging, syntax, and logic. If the user asks about ANYTHING non-coding (e.g. weather, recipes, politics, general chat, movies, trivia, opinions), immediately decline with:
"I can only answer coding and algorithm questions for this challenge."

2. STRICT LANGUAGE CONSTRAINT: You must ONLY answer questions and discuss code in ${language.toUpperCase()}. If the user asks for solutions, syntax, or comparisons in any other programming language (e.g. asking for Java/C++/JS when the current chapter is ${language}), you must refuse and redirect:
"This chapter is strictly for ${language.toUpperCase()}. Please ask your question in or about ${language.toUpperCase()}."

3. CHAPTER & CHALLENGE FOCUS: Guide the student towards understanding the core concepts of this chapter (${chapter}) and how to solve "${challengeTitle}". Explain time/space complexity, edge cases, language idioms, or logic flaws.

4. PEDAGOGICAL COACHING: Do not give away the entire complete copy-paste solution to the challenge immediately. Help the student think it through with guided questions, pseudocode, or small illustrative snippets.

5. FORMATTING: Be concise, clear, and friendly. Use Markdown backticks for code and code blocks.`;

  try {
    const rawMessages = Array.isArray(body.messages) && body.messages.length > 0 ? body.messages : [];
    
    // Build conversation array with system prompt first, then recent history, then the user's latest query
    const conversation = [
      { role: "system", content: systemPrompt },
      ...rawMessages.slice(-6).map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: String(msg.content ?? "").slice(0, 1000),
      })),
      { role: "user", content: userQuery },
    ];

    const reply = await createChatCompletion({
      messages: conversation,
      maxTokens: 350,
      temperature: 0.2, // low temperature for strict adherence to guardrails
    });

    return res.status(200).json({
      score: null,
      feedback: reply,
      reply,
    });
  } catch (error) {
    return res.status(200).json({
      score: null,
      feedback: `Could not reach mentor right now (${error?.message || "network error"}). Try again in a moment.`,
    });
  }
}
