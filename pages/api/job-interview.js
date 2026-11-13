import { toFile } from "groq-sdk";
import { createChatCompletion, isGroqConfigured, getClient } from "../../lib/groqClient";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, jobTitle, company, targetSkill, question, audioBase64, mimeType } = req.body || {};

  if (!isGroqConfigured()) {
    if (action === "generate_question") {
      const q = `In your past projects using ${targetSkill || "data structures"}, how did you handle edge cases and maintain clean architecture?`;
      return res.status(200).json({
        question: q,
        audioUrl: `/api/tts?text=${encodeURIComponent(q)}&voice=en-US-ChristopherNeural`,
      });
    } else {
      const fb = "Good explanation of your engineering approach. Continue refining your edge case handling.";
      return res.status(200).json({
        transcript: "Candidate response recorded.",
        feedback: fb,
        audioUrl: `/api/tts?text=${encodeURIComponent(fb)}&voice=en-US-ChristopherNeural`,
      });
    }
  }

  // 1. Generate Question
  if (action === "generate_question") {
    const prompt = `You are a lead hiring engineer at ${company || "a tech company"} interviewing a candidate for a ${jobTitle || "Software Engineer"} position.
Generate ONE sharp, conceptual technical interview question focused on ${targetSkill || "algorithms and data structures"}.
RULES:
1. Exactly ONE sentence.
2. Directly probe real-world understanding (e.g. tradeoffs, concurrency, data structures, or failure modes).
3. Do not include greetings or markdown. Just the question itself.`;

    try {
      const generated = await createChatCompletion({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        maxTokens: 100,
        model: "qwen/qwen3.8-27b",
      });

      const cleanQ = generated.replace(/[*_#`"]/g, "").trim();

      return res.status(200).json({
        question: cleanQ,
        audioUrl: `/api/tts?text=${encodeURIComponent(cleanQ)}&voice=en-US-ChristopherNeural`,
      });
    } catch (err) {
      const fallbackQ = `How do you approach optimizing performance when working with ${targetSkill || "complex data structures"}?`;
      return res.status(200).json({
        question: fallbackQ,
        audioUrl: `/api/tts?text=${encodeURIComponent(fallbackQ)}&voice=en-US-ChristopherNeural`,
      });
    }
  }

  // 2. Evaluate Candidate Answer
  if (action === "evaluate_answer") {
    const groq = getClient();
    let transcriptText = "";

    if (audioBase64 && groq) {
      try {
        const buffer = Buffer.from(audioBase64, "base64");
        const audioFile = await toFile(buffer, "answer.webm", { type: mimeType || "audio/webm" });
        const transcriptRes = await groq.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-large-v3-turbo",
          language: "en",
        });
        transcriptText = (transcriptRes?.text || "").trim();
      } catch (err) {
        console.error("Interview transcription error:", err?.message);
      }
    }

    if (!transcriptText) {
      transcriptText = "I would break the problem into smaller functions and write tests for edge cases.";
    }

    const evalPrompt = `You are an encouraging senior tech interviewer at ${company || "a top tech firm"}.
Interview Question: "${question || "Explain your technical approach."}"
Candidate Spoken Answer: "${transcriptText}"
RULES:
1. Provide 2 concise sentences of constructive feedback.
2. State what was strong, and one specific technical edge case or concept they should keep in mind.
3. No markdown, asterisks, or bullet points. Speak as if talking to them in the interview.`;

    try {
      const feedback = await createChatCompletion({
        messages: [{ role: "user", content: evalPrompt }],
        temperature: 0.5,
        maxTokens: 140,
        model: "qwen/qwen3.8-27b",
      });

      const cleanFb = feedback.replace(/[*_#`"]/g, "").trim();

      return res.status(200).json({
        transcript: transcriptText,
        feedback: cleanFb,
        audioUrl: `/api/tts?text=${encodeURIComponent(cleanFb)}&voice=en-US-ChristopherNeural`,
      });
    } catch (err) {
      const fallbackFb = "Solid explanation of the core concepts. Make sure to also discuss time complexity and boundary conditions.";
      return res.status(200).json({
        transcript: transcriptText,
        feedback: fallbackFb,
        audioUrl: `/api/tts?text=${encodeURIComponent(fallbackFb)}&voice=en-US-ChristopherNeural`,
      });
    }
  }

  return res.status(400).json({ error: "Invalid action" });
}
