export default async function handler(req, res) {
  if (req.method === "HEAD") {
    res.setHeader("Content-Type", "audio/mpeg");
    return res.status(200).end();
  }

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, HEAD");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawText =
    req.method === "POST" ? req.body?.text : req.query?.text;
  const text =
    typeof rawText === "string" && rawText.trim()
      ? rawText.trim().replace(/["\n\r]/g, " ")
      : "";

  if (!text) {
    return res.status(400).json({ error: "Text parameter is required" });
  }

  try {
    // Split into chunks of <= 180 chars on word boundaries
    const words = text.split(/\s+/);
    const chunks = [];
    let current = [];

    for (const word of words) {
      const currentLen = current.reduce((acc, w) => acc + w.length, 0) + current.length;
      if (currentLen + word.length + 1 <= 180) {
        current.push(word);
      } else {
        if (current.length > 0) {
          chunks.push(current.join(" "));
        }
        current = [word];
      }
    }
    if (current.length > 0) {
      chunks.push(current.join(" "));
    }

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

      if (!response.ok) {
        throw new Error(`TTS service responded with ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      buffers.push(Buffer.from(arrayBuffer));
    }

    const fullAudio = Buffer.concat(buffers);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", fullAudio.length);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.send(fullAudio);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to generate speech" });
  }
}
