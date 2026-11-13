/**
 * Local account + session adapter for the CodeMentor demo.
 *
 * Everything lives in localStorage/sessionStorage. Passwords are never stored
 * in plain text: each account gets a random salt and a SHA-256 digest produced
 * with crypto.subtle. This is demo-grade auth, not a production identity system.
 *
 * Storage keys:
 *   codementor_users       -> { [lowercaseUsername]: Account }
 *   codementor_session     -> { username, createdAt } (localStorage or sessionStorage)
 *   codementor_last_user   -> lowercase username string (login prefill only)
 *
 * The storage helpers are synchronous. signup/login/migrateGuestToAccount are
 * async only because crypto.subtle.digest is async; call sites should use the
 * returned { ok, user, error } result as the source of truth.
 */

export const USERS_KEY = "codementor_users";
export const SESSION_KEY = "codementor_session";
export const LAST_USER_KEY = "codementor_last_user";
export const AUTH_EVENT = "codementor:auth";
export const PROGRESS_EVENT = "codementor:progress";
const LEGACY_SOLVED_KEY = "codementor.solved.v1";

const USERNAME_PATTERN = /^[a-z0-9_]+$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_DISPLAY_NAME_LENGTH = 30;

/** XP awarded for the first time a challenge is marked solved. */
export const XP_PER_SOLVE = 10;

function hasWindow() {
  return typeof window !== "undefined";
}

export function defaultProgress() {
  return {
    xp: 0,
    streak: 0,
    lastSolvedAt: null,
    solvedChallengeIds: [],
    attempts: {},
    hintsUsed: {},
    learningStyle: null,
    darkMode: true,
    leaderboardStats: {
      challengesSolved: 0,
      totalAttempts: 0,
      hintsUsed: 0,
      xp: 0,
      streak: 0,
      lastSolvedAt: null,
    },
  };
}

export function normalizeUsername(username) {
  return String(username ?? "").trim().toLowerCase();
}

export function validateUsername(username) {
  const value = normalizeUsername(username);

  if (value.length < 3 || value.length > 20) {
    return "Username must be 3-20 characters.";
  }

  if (!USERNAME_PATTERN.test(value)) {
    return "Use letters, numbers, and underscores only.";
  }

  return null;
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function mergeProgress(base, partial) {
  const source = partial && typeof partial === "object" ? partial : {};
  const next = { ...base, ...source };

  next.solvedChallengeIds = Array.isArray(source.solvedChallengeIds)
    ? [
        ...new Set(
          source.solvedChallengeIds.filter((value) => typeof value === "string")
        ),
      ]
    : [...(base.solvedChallengeIds ?? [])];

  next.attempts = {
    ...(base.attempts ?? {}),
    ...(source.attempts && typeof source.attempts === "object"
      ? source.attempts
      : {}),
  };

  next.hintsUsed = {
    ...(base.hintsUsed ?? {}),
    ...(source.hintsUsed && typeof source.hintsUsed === "object"
      ? source.hintsUsed
      : {}),
  };

  next.xp = numberOrZero(next.xp);
  next.streak = numberOrZero(next.streak);
  next.lastSolvedAt =
    typeof next.lastSolvedAt === "string" ? next.lastSolvedAt : null;
  next.learningStyle =
    typeof next.learningStyle === "string" ? next.learningStyle : null;
  next.darkMode = next.darkMode !== false;

  const totalAttempts = Object.values(next.attempts).reduce(
    (sum, value) => sum + numberOrZero(value),
    0
  );
  const totalHints = Object.values(next.hintsUsed).reduce(
    (sum, value) => sum + numberOrZero(value),
    0
  );

  next.leaderboardStats = {
    ...(base.leaderboardStats ?? {}),
    ...(source.leaderboardStats && typeof source.leaderboardStats === "object"
      ? source.leaderboardStats
      : {}),
    challengesSolved: next.solvedChallengeIds.length,
    totalAttempts,
    hintsUsed: totalHints,
    xp: next.xp,
    streak: next.streak,
    lastSolvedAt: next.lastSolvedAt,
  };

  return next;
}

function readUsers() {
  if (!hasWindow()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const users = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") {
        continue;
      }

      const username = normalizeUsername(value.username || key);
      if (!username) {
        continue;
      }

      users[username] = {
        username,
        displayName:
          typeof value.displayName === "string" && value.displayName.trim()
            ? value.displayName.trim()
            : username,
        passwordHash:
          typeof value.passwordHash === "string" ? value.passwordHash : null,
        salt: typeof value.salt === "string" ? value.salt : null,
        createdAt:
          typeof value.createdAt === "string"
            ? value.createdAt
            : new Date().toISOString(),
        isGuest: Boolean(value.isGuest),
        progress: mergeProgress(defaultProgress(), value.progress),
      };
    }

    return users;
  } catch {
    return {};
  }
}

function writeUsers(users) {
  if (!hasWindow()) {
    return;
  }

  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // Storage may be unavailable (private mode, quota). Callers still get a result.
  }
}

function sanitizeUser(account) {
  if (!account) {
    return null;
  }

  return {
    username: account.username,
    displayName: account.displayName,
    isGuest: account.isGuest,
    createdAt: account.createdAt,
    progress: mergeProgress(defaultProgress(), account.progress),
  };
}

function readLegacySolvedIds() {
  if (!hasWindow()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_SOLVED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((value) => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function clearLegacySolvedIds() {
  if (!hasWindow()) {
    return;
  }

  try {
    window.localStorage.removeItem(LEGACY_SOLVED_KEY);
  } catch {
    // ignore
  }
}

function randomHex(byteLength) {
  const bytes = new Uint8Array(byteLength);

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value) {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error(
      "Secure password hashing is unavailable in this browser. Use localhost or HTTPS."
    );
  }

  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password, salt) {
  return sha256Hex(`${salt}:${password}`);
}

function emitAuthChange() {
  if (!hasWindow()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_EVENT));
}

function clearSession() {
  if (!hasWindow()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }

  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

function writeSession(username, rememberMe) {
  if (!hasWindow()) {
    return;
  }

  clearSession();

  const payload = JSON.stringify({
    username,
    createdAt: new Date().toISOString(),
  });

  try {
    if (rememberMe) {
      window.localStorage.setItem(SESSION_KEY, payload);
    } else {
      window.sessionStorage.setItem(SESSION_KEY, payload);
    }
  } catch {
    // ignore storage failures
  }
}

function setLastUsername(username) {
  if (!hasWindow()) {
    return;
  }

  try {
    window.localStorage.setItem(LAST_USER_KEY, username);
  } catch {
    // ignore
  }
}

export function getSession() {
  if (!hasWindow()) {
    return null;
  }

  // sessionStorage wins when both exist, because a non-remembered login is the
  // more recent explicit choice. Either storage is valid.
  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      const raw = storage.getItem(SESSION_KEY);
      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.username === "string") {
        return {
          username: normalizeUsername(parsed.username),
          createdAt:
            typeof parsed.createdAt === "string" ? parsed.createdAt : null,
        };
      }
    } catch {
      // Try the next storage.
    }
  }

  return null;
}

export function getCurrentUser() {
  const session = getSession();
  if (!session) {
    return null;
  }

  const account = readUsers()[session.username];
  return sanitizeUser(account);
}

export function getLastUsername() {
  if (!hasWindow()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LAST_USER_KEY);
    return raw ? normalizeUsername(raw) : null;
  } catch {
    return null;
  }
}

export function clearLastUsername() {
  if (!hasWindow()) {
    return;
  }

  try {
    window.localStorage.removeItem(LAST_USER_KEY);
  } catch {
    // ignore
  }
}

export function getUser(username) {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    return null;
  }

  return sanitizeUser(readUsers()[normalized]);
}

export function getAllUsers() {
  return Object.values(readUsers()).map(sanitizeUser);
}

export function isUsernameTaken(username) {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    return false;
  }

  return Boolean(readUsers()[normalized]);
}

export async function signup(username, displayName, password) {
  const normalized = normalizeUsername(username);
  const usernameError = validateUsername(normalized);

  if (usernameError) {
    return { ok: false, error: usernameError, field: "username" };
  }

  if (String(password ?? "").length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      field: "password",
    };
  }

  if (String(password ?? "").length > 64) {
    return {
      ok: false,
      error: "Password must be 64 characters or fewer.",
      field: "password",
    };
  }

  const name = String(displayName ?? "")
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, MAX_DISPLAY_NAME_LENGTH) || normalized;

  if (name.length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      ok: false,
      error: `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`,
      field: "displayName",
    };
  }

  const users = readUsers();

  if (users[normalized]) {
    return {
      ok: false,
      error: "That username is already taken.",
      field: "username",
    };
  }

  const salt = randomHex(16);
  let passwordHash;

  try {
    passwordHash = await hashPassword(password, salt);
  } catch (error) {
    return { ok: false, error: error.message };
  }

  const legacySolvedIds = readLegacySolvedIds();
  const progress = legacySolvedIds.length
    ? mergeProgress(defaultProgress(), {
        solvedChallengeIds: legacySolvedIds,
        // Pre-account solves keep their checkmarks and earn the same first-solve XP.
        xp: legacySolvedIds.length * XP_PER_SOLVE,
      })
    : defaultProgress();

  const account = {
    username: normalized,
    displayName: name,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
    isGuest: false,
    progress,
  };

  users[normalized] = account;
  writeUsers(users);

  if (legacySolvedIds.length) {
    clearLegacySolvedIds();
  }

  // Signing up starts a remembered session by default; the login form is where
  // the explicit "Remember me" choice lives.
  writeSession(normalized, true);
  setLastUsername(normalized);
  emitAuthChange();

  return { ok: true, user: sanitizeUser(account) };
}

export async function login(username, password, rememberMe = false) {
  const normalized = normalizeUsername(username);
  const users = readUsers();
  const account = users[normalized];
  const genericError = "Incorrect username or password";

  if (!account || account.isGuest || !account.passwordHash || !account.salt) {
    return { ok: false, error: genericError };
  }

  let candidate;

  try {
    candidate = await hashPassword(password, account.salt);
  } catch (error) {
    return { ok: false, error: error.message };
  }

  if (candidate !== account.passwordHash) {
    return { ok: false, error: genericError };
  }

  writeSession(normalized, Boolean(rememberMe));
  setLastUsername(normalized);
  emitAuthChange();

  return { ok: true, user: sanitizeUser(account) };
}

export function loginAsGuest() {
  const current = getCurrentUser();

  if (current?.isGuest) {
    return { ok: true, user: current };
  }

  const users = readUsers();
  let username = `guest_${randomHex(6)}`;

  while (users[username]) {
    username = `guest_${randomHex(6)}`;
  }

  const legacySolvedIds = readLegacySolvedIds();
  const progress = legacySolvedIds.length
    ? mergeProgress(defaultProgress(), {
        solvedChallengeIds: legacySolvedIds,
        // Pre-account solves keep their checkmarks and earn the same first-solve XP.
        xp: legacySolvedIds.length * XP_PER_SOLVE,
      })
    : defaultProgress();

  const account = {
    username,
    displayName: "Guest",
    passwordHash: null,
    salt: null,
    createdAt: new Date().toISOString(),
    isGuest: true,
    progress,
  };

  users[username] = account;
  writeUsers(users);

  if (legacySolvedIds.length) {
    clearLegacySolvedIds();
  }

  // Guest sessions survive refreshes. They are not "remember me" account logins.
  writeSession(username, true);
  emitAuthChange();

  return { ok: true, user: sanitizeUser(account) };
}

export function logout() {
  if (!hasWindow()) {
    return;
  }

  // Session only. Accounts, progress, and codementor_last_user stay intact.
  clearSession();
  emitAuthChange();
}

export function updateProgress(username, partialProgressObject) {
  const normalized = normalizeUsername(username);
  const users = readUsers();
  const account = users[normalized];

  if (!account) {
    return { ok: false, error: "Account not found." };
  }

  account.progress = mergeProgress(account.progress, partialProgressObject);
  users[normalized] = account;
  writeUsers(users);

  if (hasWindow()) {
    window.dispatchEvent(
      new CustomEvent(PROGRESS_EVENT, { detail: { username: normalized } })
    );
  }

  return {
    ok: true,
    user: sanitizeUser(account),
    progress: account.progress,
  };
}

export function resetProgress(username) {
  const normalized = normalizeUsername(username);
  const users = readUsers();
  const account = users[normalized];

  if (!account) {
    return { ok: false, error: "Account not found." };
  }

  account.progress = defaultProgress();
  users[normalized] = account;
  writeUsers(users);

  if (hasWindow()) {
    window.dispatchEvent(
      new CustomEvent(PROGRESS_EVENT, { detail: { username: normalized } })
    );
  }

  return { ok: true, user: sanitizeUser(account), progress: account.progress };
}

export async function migrateGuestToAccount(
  guestUsername,
  newUsername,
  displayName,
  password
) {
  const guestKey = normalizeUsername(guestUsername);
  const users = readUsers();
  const guest = users[guestKey];

  if (!guest || !guest.isGuest) {
    return { ok: false, error: "Guest session not found." };
  }

  const normalized = normalizeUsername(newUsername);
  const usernameError = validateUsername(normalized);

  if (usernameError) {
    return { ok: false, error: usernameError, field: "username" };
  }

  if (users[normalized]) {
    return {
      ok: false,
      error: "That username is already taken.",
      field: "username",
    };
  }

  if (String(password ?? "").length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      field: "password",
    };
  }

  if (String(password ?? "").length > 64) {
    return {
      ok: false,
      error: "Password must be 64 characters or fewer.",
      field: "password",
    };
  }

  const name = String(displayName ?? "")
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, MAX_DISPLAY_NAME_LENGTH) || normalized;

  if (name.length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      ok: false,
      error: `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`,
      field: "displayName",
    };
  }

  const salt = randomHex(16);
  let passwordHash;

  try {
    passwordHash = await hashPassword(password, salt);
  } catch (error) {
    return { ok: false, error: error.message };
  }

  const account = {
    username: normalized,
    displayName: name,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
    isGuest: false,
    progress: mergeProgress(defaultProgress(), guest.progress),
  };

  delete users[guestKey];
  users[normalized] = account;
  writeUsers(users);

  writeSession(normalized, true);
  setLastUsername(normalized);
  emitAuthChange();

  return { ok: true, user: sanitizeUser(account) };
}
