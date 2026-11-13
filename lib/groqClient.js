import Groq from "groq-sdk";

const GROQ_MODEL = "openai/gpt-oss-20b";
const GROQ_TIMEOUT_MS = 8000;

let groqClient = null;

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

function getClient() {
  if (!process.env.GROQ_API_KEY) return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

export async function createChatCompletion({ messages, maxTokens = 150, temperature = 0.5 }) {
  const groq = getClient();
  if (!groq) {
    throw new Error("Groq is not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const completion = await groq.chat.completions.create(
      {
        model: GROQ_MODEL,
        // gpt-oss is a reasoning model: keep its hidden reasoning minimal and
        // leave enough token headroom that the visible answer is never starved.
        reasoning_effort: "low",
        max_tokens: Math.max(maxTokens, 512),
        temperature,
        messages,
      },
      { signal: controller.signal }
    );
    const choice = completion.choices?.[0];
    const content = choice?.message?.content;
    if (!content) {
      throw new Error(
        `Groq returned an empty response (finish_reason=${choice?.finish_reason ?? "unknown"})`
      );
    }
    return content.trim();
  } finally {
    clearTimeout(timer);
  }
}
