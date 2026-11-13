import challenges from "../../data/challenges.json";

const DIFF_ORDER = { easy: 0, medium: 1 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ recommendedChallengeId: null, reason: "No challenge selected yet." });
  }

  const body = req.body;
  const completedChallengeId =
    body && typeof body.completedChallengeId === "string" ? body.completedChallengeId : "";
  const attemptNumber = Number(body?.attemptCount);
  const attemptCount = Number.isFinite(attemptNumber) ? Math.trunc(attemptNumber) : 0;
  const timeTakenSeconds = Number(body?.timeTakenSeconds);

  const completed = challenges[completedChallengeId];
  let recommendedChallengeId = null;
  let reason = "Keep practicing — you've got this!";

  if (completed) {
    const completedLevel = DIFF_ORDER[completed.difficulty] ?? 0;
    const harder = Object.keys(challenges).filter(
      (slug) =>
        slug !== completedChallengeId &&
        (DIFF_ORDER[challenges[slug].difficulty] ?? 0) > completedLevel
    );
    const sameLevel = Object.keys(challenges).filter(
      (slug) =>
        slug !== completedChallengeId &&
        (DIFF_ORDER[challenges[slug].difficulty] ?? 0) === completedLevel
    );

    const fastFinish =
      attemptCount <= 2 && Number.isFinite(timeTakenSeconds) ? timeTakenSeconds < 120 : true;

    if (fastFinish && harder.length > 0) {
      recommendedChallengeId = harder[0];
      reason = "You moved fast — time for a bigger challenge!";
    } else if (sameLevel.length > 0) {
      recommendedChallengeId = sameLevel[0];
      reason = "Nice work — keep building on this difficulty.";
    } else if (harder.length > 0) {
      recommendedChallengeId = harder[0];
      reason = "Great job — here's a step up.";
    }
  }

  return res.status(200).json({ recommendedChallengeId, reason });
}
