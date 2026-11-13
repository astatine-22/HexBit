import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      error: "This endpoint only accepts POST requests.",
    });
  }

  const body = req.body;

  if (!body || typeof body !== "object") {
    return res.status(400).json({
      ok: false,
      error: "Please send a JSON body with userId, challengeId, and passed.",
    });
  }

  const { userId, challengeId } = body;

  if (typeof userId !== "string" || userId.trim() === "") {
    return res.status(400).json({
      ok: false,
      error: "Please include a userId (any anonymous id string works).",
    });
  }

  if (typeof challengeId !== "string" || challengeId.trim() === "") {
    return res.status(400).json({
      ok: false,
      error: "Please include a challengeId (the challenge slug, e.g. \"reverse-string\").",
    });
  }

  const record = {
    user_id: userId.trim(),
    challenge_id: challengeId.trim(),
    passed: body.passed === true,
    updated_at: new Date().toISOString(),
  };

  // Optional: the frontend can send attemptCount so progress keeps a tally.
  const attemptNumber = Number(body.attemptCount);
  if (Number.isFinite(attemptNumber) && attemptNumber > 0) {
    record.attempts = Math.trunc(attemptNumber);
  }

  // Supabase env vars missing — don't break the demo flow over progress
  // bookkeeping; report success with persisted: false.
  if (!supabase) {
    console.error("Supabase is not configured; progress was not persisted.");
    return res.status(200).json({ ok: true, persisted: false });
  }

  try {
    const { error } = await supabase
      .from("progress")
      .upsert(record, { onConflict: "user_id,challenge_id" });

    if (error) {
      throw error;
    }

    return res.status(200).json({ ok: true, persisted: true });
  } catch (error) {
    console.error("Progress upsert failed:", error.message);
    return res.status(200).json({ ok: true, persisted: false });
  }
}
