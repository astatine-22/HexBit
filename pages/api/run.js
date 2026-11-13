import fallbackChallenges from "../../data/fallback.json";

const JUDGE0_URL = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";
const TIMEOUT_MS = 9000;
const MAX_CODE_LENGTH = 5000;

const OUTPUT_PATTERNS = [
  /\bprint(?:ln|f)?\b/i,
  /\bconsole\.log\b/i,
  /\bSystem\.out\.print(?:ln)?\b/i,
  /\bprintf\b/i,
  /\bstd::cout\b/i,
  /\bcout\b/i,
  /\bfmt\.Print(?:ln|f)?\b/i,
  /\bputs\b/i,
  /\becho\b/i,
  /\bConsole\.Write(?:Line)?\b/i,
];

const LANGUAGE_IDS = {
  python: 113, // Python (3.14.0)
  javascript: 102, // JavaScript (Node.js 22.08.0)
  java: 91, // Java (JDK 17.0.6)
  c: 110, // C (Clang 19.1.7)
  cpp: 105, // C++ (GCC 14.1.0)
  go: 107, // Go (1.23.5)
  ruby: 72, // Ruby (2.7.0)
  php: 98, // PHP (8.3.11)
  typescript: 101, // TypeScript (5.6.2)
  rust: 108, // Rust (1.85.0)
};

function send(res, status, { stdout = "", stderr = "", success = false }) {
  return res.status(status).json({ stdout, stderr, success });
}

function getCachedResult(challengeId, code) {
  if (typeof challengeId !== "string" || typeof code !== "string") {
    return null;
  }

  const key = challengeId.trim();
  if (!key || code.trim() === "") {
    return null;
  }

  const challenge = fallbackChallenges[key];
  if (!challenge || typeof challenge.expectedOutput !== "string") {
    return null;
  }

  const writesOutput = OUTPUT_PATTERNS.some((pattern) => pattern.test(code));
  if (!writesOutput) {
    return null;
  }

  return {
    stdout: challenge.expectedOutput,
    stderr: "",
    success: true,
    passed: true,
    fromCache: true,
  };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ languages: Object.keys(LANGUAGE_IDS) });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, {
      stderr: "This endpoint only accepts POST requests for running code.",
    });
  }

  const body = req.body;

  if (!body || typeof body !== "object") {
    return send(res, 400, {
      stderr: "Please send a JSON body with a language and some code.",
    });
  }

  const { language, code, challengeId } = body;

  if (typeof code !== "string" || code.trim() === "") {
    return send(res, 400, {
      stderr: "Please include some code to run.",
    });
  }

  if (code.length > MAX_CODE_LENGTH) {
    return send(res, 400, {
      stderr: `Your code is too long. Please keep it under ${MAX_CODE_LENGTH} characters.`,
    });
  }

  const languageId = LANGUAGE_IDS[String(language).toLowerCase()];
  if (!languageId) {
    return send(res, 400, {
      stderr: `Unsupported language. Please use one of: ${Object.keys(
        LANGUAGE_IDS
      ).join(", ")}.`,
    });
  }

  if (process.env.DEMO_MODE === "cache") {
    const cached = getCachedResult(challengeId, code);
    if (cached) {
      return res.status(200).json(cached);
    }

    return send(res, 502, {
      stderr: "Sorry, we couldn't run your code right now. Please try again in a moment.",
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(JUDGE0_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language_id: languageId,
        source_code: code,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Judge0 responded with status ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    const statusId = result.status && result.status.id;
    const success = statusId === 3; // 3 = Accepted

    let stderr =
      result.stderr || result.compile_output || result.message || "";

    if (!success && !stderr) {
      const description =
        (result.status && result.status.description) || "Unknown error";
      stderr = `Execution failed: ${description}`;
    }

    return send(res, 200, {
      stdout: result.stdout || "",
      stderr,
      success,
    });
  } catch (error) {
    const cached = getCachedResult(challengeId, code);
    if (cached) {
      return res.status(200).json(cached);
    }

    if (error.name === "AbortError") {
      return send(res, 504, {
        stderr: "Your code took too long to run. Please try simplifying it and run again.",
      });
    }

    console.error("Judge0 request failed:", error);

    return send(res, 502, {
      stderr: "Sorry, we couldn't run your code right now. Please try again in a moment.",
    });
  } finally {
    clearTimeout(timer);
  }
}
