/**
 * Mentor + recommendation integration layer.
 *
 * Thin fetch adapters over the production backend API routes:
 *   POST /api/hint            -> { hint }
 *   POST /api/recommend-next -> { recommendedChallengeId, reason }
 *   POST /api/check-approach -> { score, feedback }
 *   POST /api/explain-error  -> { explanation }
 *   POST /api/summary        -> { summary }
 */

async function post(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return res.json();
}

export async function requestHint({
  challengeId,
  userCode,
  errorMessage,
  attemptCount,
  learningStyle,
  experienceLevel,
}) {
  const { getChallengeById } = await import("@/lib/challenges");
  const challenge = await getChallengeById(challengeId);

  if (!challenge) {
    return "I could not find that challenge. Head back to the shelf and pick another pressing.";
  }

  const data = await post("/api/hint", {
    challengeId,
    challengeDescription: challenge.description,
    userCode: userCode ?? "",
    errorMessage: errorMessage ?? "",
    attemptCount: attemptCount ?? 1,
    slug: challenge.id,
    language: challenge.language,
    learningStyle: learningStyle ?? "",
    experienceLevel: experienceLevel ?? "",
  });

  return data?.hint ?? "The mentor could not come up with a hint right now. Try again in a moment.";
}

export async function suggestNextChallenge({ solvedIds = [] } = {}) {
  const { getChallenges } = await import("@/lib/challenges");
  const challenges = await getChallenges();

  const solved = (solvedIds ?? []).map(String);
  const completedId = solved[solved.length - 1];
  const data = await post("/api/recommend-next", {
    completedChallengeId: completedId,
    attemptCount: 2,
    timeTakenSeconds: 30,
  });

  const challenge = challenges.find(
    (item) => item.id === data?.recommendedChallengeId
  ) ?? null;

  return {
    challenge,
    reason: data?.reason ?? "Keep the streak alive.",
  };
}

export async function checkApproach({ challengeId, approach, language, messages }) {
  const { getChallengeById } = await import("@/lib/challenges");
  const challenge = await getChallengeById(challengeId);

  const data = await post("/api/check-approach", {
    challengeId,
    challengeTitle: challenge?.title ?? "",
    challengeDescription: challenge?.description ?? "",
    category: challenge?.category ?? "",
    approach: approach ?? "",
    language: language ?? challenge?.language ?? "",
    messages: messages ?? [],
  });

  return data;
}

export async function explainError({ challengeId, code, language, error }) {
  const { getChallengeById } = await import("@/lib/challenges");
  const challenge = await getChallengeById(challengeId);

  const data = await post("/api/explain-error", {
    challengeId,
    rawError: error ?? "",
    language: language ?? challenge?.language,
  });

  return data;
}

export async function getSolutionSummary({ challengeId, code, language }) {
  const { getChallengeById } = await import("@/lib/challenges");
  const challenge = await getChallengeById(challengeId);

  const data = await post("/api/summary", {
    challengeTitle: challenge?.title ?? "this challenge",
    attemptCount: 1,
    errorHistory: [],
  });

  return { summary: data?.summary ?? "Nice work — you solved it!" };
}
