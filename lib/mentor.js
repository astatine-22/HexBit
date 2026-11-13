import { getChallengeById, getChallenges } from "@/lib/challenges";

/**
 * Mentor integration point.
 *
 * Everything "AI-flavoured" lives behind this module and <MentorPanel />. The
 * rest of the app never needs to know how hints are produced.
 *
 * TODO: replace with real API call to /api/hint
 */
export async function requestHint({
  challengeId,
  userCode,
  errorMessage,
  attemptCount,
}) {
  const challenge = await getChallengeById(challengeId);

  if (!challenge) {
    return "I could not find that challenge. Head back to the shelf and pick another pressing.";
  }

  await new Promise((resolve) => setTimeout(resolve, 700));

  const safeAttempt = Number.isFinite(attemptCount) ? attemptCount : 0;
  const hintIndex = Math.min(
    Math.max(safeAttempt, 0),
    challenge.hints.length - 1
  );
  const hint = challenge.hints[hintIndex];

  if (errorMessage) {
    return `Let's clear that error before moving on. ${hint}`;
  }

  if (!String(userCode ?? "").trim()) {
    return `Start by writing a little code — even a wrong attempt gives us something to work with. ${hint}`;
  }

  return hint;
}

/**
 * Mock "adaptive difficulty" recommendation.
 *
 * TODO: replace with real API call to /api/recommendation
 */
export async function suggestNextChallenge({ solvedIds = [] } = {}) {
  const challenges = await getChallenges();
  const solved = new Set(solvedIds);
  const unsolved = challenges.filter((challenge) => !solved.has(challenge.id));

  if (unsolved.length === 0) {
    return {
      challenge: null,
      reason: "Every pressing on the shelf is solved. Time to press a new record.",
    };
  }

  const byDifficulty = { easy: 0, medium: 1, hard: 2 };
  const next = [...unsolved].sort(
    (a, b) => byDifficulty[a.difficulty] - byDifficulty[b.difficulty]
  )[0];

  return {
    challenge: next,
    reason: `A ${next.difficulty} ${next.category.toLowerCase()} piece keeps the streak moving without jumping straight into the deep end.`,
  };
}