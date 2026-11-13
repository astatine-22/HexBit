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
    return res.status(405).json({ transcription: "", reply: "Method not allowed." });
  }

  const body = req.body || {};
  const audioBase64 = typeof body.audioBase64 === "string" ? body.audioBase64 : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "audio/webm";
  const code = typeof body.code === "string" ? body.code : "";
  const errorMessage = typeof body.errorMessage === "string" ? body.errorMessage : "";
  const language = typeof body.language === "string" ? body.language : "this language";
  const challengeTitle = typeof body.challengeTitle === "string" ? body.challengeTitle : "this challenge";
  const learningStyle = typeof body.learningStyle === "string" ? body.learningStyle : "socratic";

  if (!audioBase64 || audioBase64.length < 50) {
    const reply = "I didn't hear anything. Try holding or clicking the intercom to speak.";
    return res.status(200).json({
      transcription: "",
      reply,
      audioUrl: `/api/tts?text=${encodeURIComponent(reply)}`,
    });
  }

  if (!isGroqConfigured()) {
    const reply = "Voice mentor is offline. Please set your GROQ_API_KEY.";
    return res.status(200).json({
      transcription: "",
      reply,
      audioUrl: `/api/tts?text=${encodeURIComponent(reply)}`,
    });
  }

  const groq = getClient();
  if (!groq) {
    const reply = "Voice mentor client is unavailable right now.";
    return res.status(200).json({
      transcription: "",
      reply,
      audioUrl: `/api/tts?text=${encodeURIComponent(reply)}`,
    });
  }

  // 1. Transcription
  let userQuestion = "";
  try {
    const buffer = Buffer.from(audioBase64, "base64");
    const audioFile = await toFile(buffer, "audio.webm", { type: mimeType || "audio/webm" });
    const transcript = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3-turbo",
      language: "en",
      temperature: 0.0,
    });
    userQuestion = (transcript?.text || "").trim();
  } catch (error) {
    console.error("Whisper transcription failed:", error?.message);
    const reply = "I had trouble hearing that clearly. Could you try asking again?";
    return res.status(200).json({
      transcription: "",
      reply,
      audioUrl: `/api/tts?text=${encodeURIComponent(reply)}`,
    });
  }

  if (!userQuestion) {
    const reply = "I didn't catch that. Could you try speaking again?";
    return res.status(200).json({
      transcription: "",
      reply,
      audioUrl: `/api/tts?text=${encodeURIComponent(reply)}`,
    });
  }

  // Teacher voice mapping based on persona
  const teacherVoice =
    learningStyle === "strict"
      ? "en-US-BrianNeural"
      : learningStyle === "direct"
        ? "en-US-AndrewMultilingualNeural"
        : "en-US-ChristopherNeural";

  // 2. Code-aware voice response
  const systemPrompt =
    "You are a friendly senior computer science teacher and mentor pair-programming with your student via intercom. The student just asked you a question out loud while looking at their code editor. RULES: 1. Keep your reply to 1 or 2 concise, warm, conversational sentences suitable for being read aloud over audio. 2. Sound like an encouraging tutor: directly pinpoint their issue or give a clear, high-leverage clue based on their code snippet and error. 3. NEVER output markdown code blocks, backticks, asterisks, or bullet points. Speak naturally and warmly as a human teacher in a 1-on-1 tutoring session.";

  const userPrompt = `Challenge: ${challengeTitle} (${language})\nLatest Code:\n${code}\n${errorMessage ? `Error Output: ${errorMessage}\n` : ""}User Asked Out Loud: "${userQuestion}"\nMentor persona: ${learningStyle}`;

  let reply = "";
  try {
    reply = await createChatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 120,
      temperature: 0.5,
      model: "qwen/qwen3.8-27b",
    });
  } catch (error) {
    console.error("Voice mentor completion failed:", error?.message);
    reply = "I'm having trouble thinking right now. Try asking again in a moment.";
  }

  if (!reply) {
    reply = "I'm having trouble thinking right now. Try asking again in a moment.";
  }

  // Strip any accidental markdown before returning
  const cleanedReply = reply.replace(/[*_#`]/g, "").trim();

  return res.status(200).json({
    transcription: userQuestion,
    reply: cleanedReply,
    audioUrl: `/api/tts?text=${encodeURIComponent(cleanedReply)}&voice=${encodeURIComponent(teacherVoice)}`,
  });
}
