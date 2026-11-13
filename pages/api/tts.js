import { spawn } from "child_process";
import path from "path";

const SCRIPT_PATH = path.join(process.cwd(), "scripts", "edge_tts_synth.py");
const DEFAULT_TEACHER_VOICE = "en-US-ChristopherNeural";

async function generateGoogleFallback(text) {
  const words = text.split(/\s+/);
  const chunks = [];
  let current = [];

  for (const word of words) {
    const currentLen = current.reduce((acc, w) => acc + w.length, 0) + current.length;
    if (currentLen + word.length + 1 <= 180) {
      current.push(word);
    } else {
      if (current.length > 0) chunks.push(current.join(" "));
      current = [word];
    }
  }
  if (current.length > 0) chunks.push(current.join(" "));

  const buffers = [];
  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      chunk
    )}&tl=en&client=tw-ob`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) throw new Error(`Google TTS status: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    buffers.push(Buffer.from(arrayBuffer));
  }
  return Buffer.concat(buffers);
}

function synthesizeNeuralTeacher(text, voice) {
  return new Promise((resolve, reject) => {
    const py = spawn("python3", [SCRIPT_PATH, text, voice], {
      timeout: 8000,
    });
    const chunks = [];
    py.stdout.on("data", (chunk) => chunks.push(chunk));
    py.on("error", (err) => reject(err));
    py.on("close", (code) => {
      if (code === 0 && chunks.length > 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`Neural synthesis exited with code ${code}`));
      }
    });
  });
}

export default async function handler(req, res) {
  if (req.method === "HEAD") {
    res.setHeader("Content-Type", "audio/mpeg");
    return res.status(200).end();
  }

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, HEAD");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawText = req.method === "POST" ? req.body?.text : req.query?.text;
  const requestedVoice = (req.method === "POST" ? req.body?.voice : req.query?.voice) || DEFAULT_TEACHER_VOICE;

  // Clean markdown syntax (*, _, `, #) so the teacher speaks smoothly
  const text =
    typeof rawText === "string" && rawText.trim()
      ? rawText
          .replace(/[*_#`~]/g, "")
          .replace(/["\n\r]/g, " ")
          .trim()
      : "";

  if (!text) {
    return res.status(400).json({ error: "Text parameter is required" });
  }

  try {
    let audioBuffer = null;
    try {
      // 1. Primary: Natural, human-like neural teacher voice (edge-tts)
      audioBuffer = await synthesizeNeuralTeacher(text, requestedVoice);
    } catch (neuralErr) {
      // 2. Fallback: Google TTS
      audioBuffer = await generateGoogleFallback(text);
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error("Empty audio generated");
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.length);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.send(audioBuffer);
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Failed to generate speech" });
  }
}
