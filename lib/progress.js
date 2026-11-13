/**
 * Account-aware progress adapter.
 *
 * Every XP, streak, attempt, hint, solved-id, learning-style, and theme write
 * goes through lib/auth.js and lands on the active account's `progress` object
 * immediately. Components keep calling the same helpers they always have.
 *
 * When nobody is signed in (public challenge browsing before a session), the
 * adapter falls back to the legacy `codementor.solved.v1` key so checkmarks
 * still work. A first signup or guest session absorbs those ids into the new
 * account and clears the legacy key.
 *
 * TODO: replace with Supabase read/write (table: user_progress)
 */

import {
  getCurrentUser,
  getAllUsers,
  resetProgress as resetAccountProgress,
  updateProgress,
} from "@/lib/auth";

const STORAGE_KEY = "codementor.solved.v1";
const USER_ID_KEY = "codementor.userId";
const XP_PER_SOLVE = 10;

function hasWindow() {
  return typeof window !== "undefined";
}

function readLegacySolvedIds() {
  if (!hasWindow()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? parsed.filter((value) => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function writeLegacySolvedIds(ids) {
  if (!hasWindow()) {
    return [];
  }

  const unique = [...new Set(ids.filter((value) => typeof value === "string"))];

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  } catch {
    // Storage might be unavailable (private mode, quota). Local state still works.
  }

  return unique;
}

function activeUser() {
  return getCurrentUser();
}

function toCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function dayKey(value) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

/**
 * Daily streak: same day keeps the streak, the next day extends it, any longer
 * gap restarts at one. `lastSolvedAt` stays an ISO timestamp.
 */
function nextStreak(progress, now = new Date()) {
  const today = dayKey(now.toISOString());
  const last = dayKey(progress?.lastSolvedAt);

  if (!last) {
    return 1;
  }

  if (last === today) {
    return Math.max(1, toCount(progress.streak) || 1);
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (last === dayKey(yesterday.toISOString())) {
    return (toCount(progress.streak) || 0) + 1;
  }

  return 1;
}

export function getActiveProgress() {
  return activeUser()?.progress ?? null;
}

export function getSolvedChallengeIds() {
  const user = activeUser();

  if (!user) {
    return readLegacySolvedIds();
  }

  return user.progress.solvedChallengeIds ?? [];
}

export function saveSolvedChallengeIds(ids) {
  const unique = [...new Set(ids.filter((value) => typeof value === "string"))];
  const user = activeUser();

  if (!user) {
    return writeLegacySolvedIds(unique);
  }

  updateProgress(user.username, { solvedChallengeIds: unique });
  return unique;
}

export function getAnonymousUserId() {
  if (!hasWindow()) {
    return "anon";
  }

  try {
    const existing = window.localStorage.getItem(USER_ID_KEY);
    if (existing) {
      return existing;
    }
  } catch {
    // storage unavailable — fall through to a generated id
  }

  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    window.localStorage.setItem(USER_ID_KEY, generated);
  } catch {
    // ignore
  }

  return generated;
}

/**
 * The id used for the optional /api/progress sync. Signed-in accounts use their
 * username; anonymous browsing keeps the legacy generated UUID.
 */
export function getProgressUserId() {
  return activeUser()?.username ?? getAnonymousUserId();
}

async function syncToServerProgress({
  userId,
  challengeId,
  passed,
  attemptCount,
}) {
  try {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, challengeId, passed, attemptCount }),
    });
  } catch {
    // backend unreachable — local state still works
  }
}

export async function markChallengeSolved(id, attemptCount = 1) {
  const user = activeUser();

  if (!user) {
    // Public browsing fallback. SolveGate normally ensures a session exists.
    const solved = readLegacySolvedIds();

    if (solved.includes(id)) {
      return solved;
    }

    const next = writeLegacySolvedIds([...solved, id]);

    await syncToServerProgress({
      userId: getAnonymousUserId(),
      challengeId: id,
      passed: true,
      attemptCount,
    });

    return next;
  }

  const progress = user.progress;
  const alreadySolved = progress.solvedChallengeIds.includes(id);
  const solvedIds = alreadySolved
    ? progress.solvedChallengeIds
    : [...progress.solvedChallengeIds, id];
  const attemptValue = Math.max(
    toCount(progress.attempts?.[id]),
    toCount(attemptCount)
  );

  updateProgress(user.username, {
    solvedChallengeIds: solvedIds,
    xp: alreadySolved ? progress.xp : toCount(progress.xp) + XP_PER_SOLVE,
    streak: alreadySolved ? progress.streak : nextStreak(progress),
    lastSolvedAt: alreadySolved
      ? progress.lastSolvedAt
      : new Date().toISOString(),
    attempts: { [id]: attemptValue },
  });

  await syncToServerProgress({
    userId: user.username,
    challengeId: id,
    passed: true,
    attemptCount: attemptValue,
  });

  return solvedIds;
}

export async function recordAttempt({
  userId,
  challengeId,
  passed,
  attemptCount,
}) {
  const user = activeUser();

  if (user) {
    const attemptValue = Math.max(
      toCount(user.progress.attempts?.[challengeId]),
      toCount(attemptCount)
    );

    updateProgress(user.username, {
      attempts: { [challengeId]: attemptValue },
    });
  }

  await syncToServerProgress({
    userId: userId ?? getProgressUserId(),
    challengeId,
    passed,
    attemptCount,
  });
}

export function getAttemptCount(challengeId) {
  return toCount(getActiveProgress()?.attempts?.[challengeId]);
}

export function getHintCount(challengeId) {
  return toCount(getActiveProgress()?.hintsUsed?.[challengeId]);
}

export function recordHintRequest(challengeId) {
  const user = activeUser();

  if (!user || !challengeId) {
    return 0;
  }

  const nextCount = toCount(user.progress.hintsUsed?.[challengeId]) + 1;

  updateProgress(user.username, {
    hintsUsed: { [challengeId]: nextCount },
  });

  return nextCount;
}

export function updateLearningStyle(learningStyle) {
  const user = activeUser();

  if (!user) {
    return null;
  }

  const value =
    typeof learningStyle === "string" && learningStyle.trim()
      ? learningStyle.trim()
      : null;

  updateProgress(user.username, { learningStyle: value });
  return value;
}

export function updateDarkMode(darkMode) {
  const user = activeUser();

  if (!user) {
    return null;
  }

  const value = Boolean(darkMode);
  updateProgress(user.username, { darkMode: value });
  return value;
}

/**
 * Leaderboard rows come from real accounts only. Guests have no display name to
 * rank under and are intentionally excluded rather than colliding on "Guest".
 */
export function getLeaderboard() {
  return getAllUsers()
    .filter((user) => !user.isGuest)
    .map((user) => {
      const progress = user.progress;
      const stats = progress.leaderboardStats ?? {};

      return {
        username: user.username,
        displayName: user.displayName,
        xp: toCount(stats.xp ?? progress.xp),
        streak: toCount(stats.streak ?? progress.streak),
        challengesSolved: toCount(
          stats.challengesSolved ?? progress.solvedChallengeIds?.length
        ),
        totalAttempts: toCount(stats.totalAttempts),
        hintsUsed: toCount(stats.hintsUsed),
        lastSolvedAt: stats.lastSolvedAt ?? progress.lastSolvedAt ?? null,
      };
    })
    .sort(
      (a, b) =>
        b.xp - a.xp ||
        b.challengesSolved - a.challengesSolved ||
        b.streak - a.streak ||
        a.displayName.localeCompare(b.displayName)
    )
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function clearSolvedChallenges() {
  const user = activeUser();

  if (user) {
    resetAccountProgress(user.username);
    return [];
  }

  if (!hasWindow()) {
    return [];
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }

  return [];
}
