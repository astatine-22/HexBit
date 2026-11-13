/**
 * Local solved-state adapter.
 *
 * The workspace and progress view only talk to these helpers. Persistence is a
 * namespace of localStorage today; it should become a Supabase read/write
 * tomorrow with no component changes.
 *
 * TODO: replace with Supabase read/write (table: user_progress)
 */

const STORAGE_KEY = "codementor.solved.v1";

function hasWindow() {
  return typeof window !== "undefined";
}

export function getSolvedChallengeIds() {
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

export function saveSolvedChallengeIds(ids) {
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

export function markChallengeSolved(id) {
  const solved = getSolvedChallengeIds();

  if (solved.includes(id)) {
    return solved;
  }

  return saveSolvedChallengeIds([...solved, id]);
}

export function clearSolvedChallenges() {
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