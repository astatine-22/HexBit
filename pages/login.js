import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import {
  clearLastUsername,
  getCurrentUser,
  getLastUsername,
  getUser,
  isUsernameTaken,
  login,
  loginAsGuest,
  migrateGuestToAccount,
  signup,
  validateUsername,
} from "@/lib/auth";

const MIN_PASSWORD_LENGTH = 6;
const USERNAME_CHARS = /^[A-Za-z0-9_]+$/;

const EMPTY_VALUES = {
  username: "",
  displayName: "",
  password: "",
  confirm: "",
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function safeNext(value) {
  const next = Array.isArray(value) ? value[0] : value;

  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) {
    return "/challenges";
  }

  return next;
}

function validateField(field, values) {
  const username = values.username.trim();

  switch (field) {
    case "username": {
      if (!username) {
        return "Choose a username.";
      }

      const lengthError = validateUsername(username);
      if (lengthError) {
        return lengthError;
      }

      if (!USERNAME_CHARS.test(username)) {
        return "Use letters, numbers, and underscores only.";
      }

      if (isUsernameTaken(username)) {
        return "That username is already taken.";
      }

      return "";
    }
    case "displayName": {
      if (values.displayName.trim().length > 40) {
        return "Display name must be 40 characters or fewer.";
      }

      return "";
    }
    case "password": {
      if (!values.password) {
        return "Choose a password.";
      }

      if (values.password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
      }

      return "";
    }
    case "confirm": {
      if (!values.confirm) {
        return "Confirm your password.";
      }

      if (values.password !== values.confirm) {
        return "Passwords do not match.";
      }

      return "";
    }
    default:
      return "";
  }
}

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="block font-mono text-[9px] uppercase tracking-[0.2em] text-paper/50"
        >
          {label}
        </label>
        {hint ? (
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-paper/25">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
      <p
        className={`mt-1.5 min-h-[14px] font-mono text-[10px] leading-snug ${
          error ? "text-[#ee917c]" : "text-transparent"
        }`}
        aria-live="polite"
      >
        {error || " "}
      </p>
    </div>
  );
}

const inputClass =
  "mt-2 w-full rounded-[3px] border border-paper/15 bg-[#0b0c0a] px-3.5 py-2.5 text-[14px] text-paper placeholder:text-paper/25 transition-colors focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/30";

export default function LoginPage() {
  const router = useRouter();
  const nextPath = useMemo(() => safeNext(router.query.next), [router.query.next]);

  const [tab, setTab] = useState("login");
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [lastUser, setLastUser] = useState(null);
  const [sessionUser, setSessionUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Session + last-user prefill are browser-only.
  useEffect(() => {
    const current = getCurrentUser();
    setSessionUser(current);

    const stored = getLastUsername();
    if (stored) {
      const account = getUser(stored);
      setLastUser({
        username: stored,
        displayName: account?.displayName || stored,
      });
      setValues((previous) => ({ ...previous, username: stored }));
    }

    setReady(true);
  }, []);

  // Honor ?mode=signup (guest banner / user menu deep links).
  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (router.query.mode === "signup") {
      setTab("signup");
    }
  }, [router.isReady, router.query.mode]);

  function switchTab(nextTab) {
    setTab(nextTab);
    setFormError("");
    setErrors({});
    setTouched({});
  }

  function handleChange(field, value) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    setFormError("");

    if (touched[field]) {
      setErrors((previous) => ({
        ...previous,
        [field]: validateField(field, nextValues),
      }));
    }

    // Keep the confirm error honest while the password changes.
    if (field === "password" && touched.confirm) {
      setErrors((previous) => ({
        ...previous,
        confirm: validateField("confirm", nextValues),
      }));
    }
  }

  function handleBlur(field) {
    setTouched((previous) => ({ ...previous, [field]: true }));
    setErrors((previous) => ({
      ...previous,
      [field]: validateField(field, values),
    }));
  }

  function handleNotYou() {
    setLastUser(null);
    clearLastUsername();
    setValues((previous) => ({ ...previous, username: "", password: "" }));
    setErrors({});
    setTouched({});
    setFormError("");
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (busy) {
      return;
    }

    const loginErrors = {
      username: values.username.trim() ? "" : "Enter your username.",
      password: values.password ? "" : "Enter your password.",
    };

    setTouched({ username: true, password: true });
    setErrors(loginErrors);

    if (loginErrors.username || loginErrors.password) {
      return;
    }

    setBusy(true);
    setFormError("");

    try {
      const [result] = await Promise.all([
        login(values.username, values.password, rememberMe),
        wait(450),
      ]);

      if (!result.ok) {
        setFormError(result.error || "Incorrect username or password");
        return;
      }

      router.push(nextPath);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    if (busy) {
      return;
    }

    const signupErrors = {
      username: validateField("username", values),
      displayName: validateField("displayName", values),
      password: validateField("password", values),
      confirm: validateField("confirm", values),
    };

    setTouched({
      username: true,
      displayName: true,
      password: true,
      confirm: true,
    });
    setErrors(signupErrors);

    if (Object.values(signupErrors).some(Boolean)) {
      return;
    }

    setBusy(true);
    setFormError("");

    try {
      const guest = getCurrentUser();
      const isMigrating = Boolean(guest?.isGuest);

      const [result] = await Promise.all([
        isMigrating
          ? migrateGuestToAccount(
              guest.username,
              values.username,
              values.displayName,
              values.password
            )
          : signup(values.username, values.displayName, values.password),
        wait(450),
      ]);

      if (!result.ok) {
        if (result.field) {
          setErrors((previous) => ({
            ...previous,
            [result.field]: result.error,
          }));
        } else {
          setFormError(result.error || "Could not create that account.");
        }
        return;
      }

      router.push(nextPath);
    } finally {
      setBusy(false);
    }
  }

  async function handleGuest() {
    if (busy) {
      return;
    }

    setBusy(true);
    setFormError("");

    try {
      const result = loginAsGuest();

      if (!result.ok) {
        setFormError(result.error || "Could not start a guest session.");
        return;
      }

      router.push(nextPath === "/challenges" ? "/challenges" : nextPath);
    } finally {
      setBusy(false);
    }
  }

  const showWelcomeBack = tab === "login" && lastUser;

  return (
    <>
      <Head>
        <title>Log in · CodeMentor</title>
        <meta
          name="description"
          content="Log in or create a CodeMentor account to keep your XP, streak, hints, and solved pressings."
        />
      </Head>

      <div className="relative min-h-screen overflow-hidden bg-ink text-paper">
        <div className="grain absolute inset-0 opacity-40" aria-hidden="true" />

        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <Link href="/challenges" className="group flex items-center gap-3">
              <span className="relative grid h-8 w-8 place-items-center rounded-full border border-paper/25">
                <span className="absolute inset-[4px] rounded-full border border-paper/10" />
                <span className="font-display text-[15px] italic leading-none">C</span>
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-display text-[19px] tracking-[-0.02em]">
                  CodeMentor
                </span>
                <span className="mt-1 font-mono text-[7px] uppercase tracking-[0.32em] text-paper/35">
                  practice shelf
                </span>
              </span>
            </Link>

            <Link
              href="/challenges"
              className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-paper/40 transition-colors hover:text-paper sm:inline"
            >
              Browse without logging in →
            </Link>
          </header>

          <main className="flex flex-1 items-center justify-center py-10">
            <div className="grid w-full max-w-4xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16">
              <div className="hidden lg:block">
                <p className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em] text-paper/40">
                  <span className="h-px w-8 bg-accent/70" aria-hidden="true" />
                  Side A · your crate
                </p>
                <h1 className="mt-5 font-display text-[clamp(2.6rem,4.4vw,3.9rem)] leading-[0.88] tracking-[-0.045em]">
                  Welcome to <span className="italic text-accent">CodeMentor</span>.
                  <span className="mt-3 block font-display text-[0.46em] leading-[1.1] tracking-[-0.01em] text-paper/55">
                    Pick up where you left off.
                  </span>
                </h1>
                <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-paper/50">
                  One account keeps your XP, daily streak, hint count, attempts,
                  and solved pressings together. Everything stays in this browser
                  for the demo.
                </p>

                <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-paper/10 pt-6 font-mono text-[9px] uppercase tracking-[0.16em] text-paper/35">
                  <div>
                    <dt className="text-paper/25">Progress</dt>
                    <dd className="mt-1 text-paper/70">Per account</dd>
                  </div>
                  <div>
                    <dt className="text-paper/25">Storage</dt>
                    <dd className="mt-1 text-paper/70">localStorage</dd>
                  </div>
                  <div>
                    <dt className="text-paper/25">Passwords</dt>
                    <dd className="mt-1 text-paper/70">SHA-256 + salt</dd>
                  </div>
                  <div>
                    <dt className="text-paper/25">Guests</dt>
                    <dd className="mt-1 text-paper/70">No password</dd>
                  </div>
                </dl>
              </div>

              <section className="rounded-[4px] border border-paper/12 bg-[#121410] p-6 shadow-2xl sm:p-8">
                <div className="lg:hidden">
                  <h1 className="font-display text-[1.9rem] leading-[0.95] tracking-[-0.04em]">
                    Welcome to <span className="italic text-accent">CodeMentor</span>.
                  </h1>
                  <p className="mt-2 text-[12px] text-paper/45">
                    Pick up where you left off.
                  </p>
                </div>

                {ready && sessionUser ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-[3px] border border-accent/25 bg-accent/[0.06] px-3 py-2 lg:mt-0">
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent">
                      {sessionUser.isGuest
                        ? "Guest session active — sign up to keep your progress"
                        : `Signed in as ${sessionUser.displayName}`}
                    </p>
                    <Link
                      href="/challenges"
                      className="font-mono text-[8px] uppercase tracking-[0.14em] text-paper/50 underline-offset-4 hover:text-paper hover:underline"
                    >
                      Continue →
                    </Link>
                  </div>
                ) : null}

                <div
                  className="mt-5 flex gap-1 border-b border-paper/10"
                  role="tablist"
                  aria-label="Log in or sign up"
                >
                  {[
                    { key: "login", label: "Log in" },
                    { key: "signup", label: "Sign up" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      role="tab"
                      aria-selected={tab === item.key}
                      onClick={() => switchTab(item.key)}
                      className={`relative px-4 py-2.5 text-[13px] transition-colors ${
                        tab === item.key
                          ? "text-paper"
                          : "text-paper/45 hover:text-paper/75"
                      }`}
                    >
                      {item.label}
                      {tab === item.key ? (
                        <span className="absolute inset-x-4 bottom-0 h-px bg-accent" />
                      ) : null}
                    </button>
                  ))}
                </div>

                {showWelcomeBack ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-[3px] border border-paper/10 bg-paper/[0.03] px-3 py-2">
                    <p className="text-[12px] text-paper/70">
                      Welcome back,{" "}
                      <span className="font-medium text-paper">
                        {lastUser.displayName}
                      </span>
                      !
                    </p>
                    <button
                      type="button"
                      onClick={handleNotYou}
                      className="font-mono text-[8px] uppercase tracking-[0.14em] text-paper/40 underline-offset-4 transition-colors hover:text-accent hover:underline"
                    >
                      Not you?
                    </button>
                  </div>
                ) : null}

                {tab === "login" ? (
                  <form onSubmit={handleLogin} className="mt-5" noValidate>
                    <Field
                      id="login-username"
                      label="Username"
                      error={errors.username}
                    >
                      <input
                        id="login-username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        value={values.username}
                        onChange={(event) => handleChange("username", event.target.value)}
                        onBlur={() => handleBlur("username")}
                        aria-invalid={Boolean(errors.username)}
                        className={inputClass}
                        placeholder="your_handle"
                      />
                    </Field>

                    <Field id="login-password" label="Password" error={errors.password}>
                      <input
                        id="login-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        value={values.password}
                        onChange={(event) => handleChange("password", event.target.value)}
                        onBlur={() => handleBlur("password")}
                        aria-invalid={Boolean(errors.password)}
                        className={inputClass}
                        placeholder="••••••"
                      />
                    </Field>

                    <label className="mt-1 flex w-fit cursor-pointer items-center gap-2.5 font-mono text-[9px] uppercase tracking-[0.14em] text-paper/45">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) => setRememberMe(event.target.checked)}
                        className="h-3.5 w-3.5 rounded-[2px] border border-paper/30 bg-transparent accent-[#d9f65a]"
                      />
                      Remember me
                    </label>

                    {formError ? (
                      <p
                        role="alert"
                        className="mt-4 rounded-[3px] border border-[#bf5741]/30 bg-[#bf5741]/10 px-3 py-2 font-mono text-[10px] text-[#ee917c]"
                      >
                        {formError}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={busy}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-[13px] font-semibold text-ink transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                    >
                      {busy ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border border-ink/25 border-t-ink" />
                          Signing in…
                        </>
                      ) : (
                        "Log in"
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignup} className="mt-5" noValidate>
                    {sessionUser?.isGuest ? (
                      <p className="mb-4 rounded-[3px] border border-accent/25 bg-accent/[0.06] px-3 py-2 text-[12px] leading-relaxed text-paper/70">
                        Creating an account now copies this guest session&apos;s
                        progress — XP, streak, solved pressings, attempts, and
                        hints.
                      </p>
                    ) : null}

                    <Field
                      id="signup-username"
                      label="Username"
                      hint="3-20 · a-z 0-9 _"
                      error={errors.username}
                    >
                      <input
                        id="signup-username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        value={values.username}
                        onChange={(event) => handleChange("username", event.target.value)}
                        onBlur={() => handleBlur("username")}
                        aria-invalid={Boolean(errors.username)}
                        className={inputClass}
                        placeholder="your_handle"
                      />
                    </Field>

                    <Field
                      id="signup-display-name"
                      label="Display name"
                      hint="optional"
                      error={errors.displayName}
                    >
                      <input
                        id="signup-display-name"
                        name="displayName"
                        type="text"
                        autoComplete="name"
                        value={values.displayName}
                        onChange={(event) =>
                          handleChange("displayName", event.target.value)
                        }
                        onBlur={() => handleBlur("displayName")}
                        aria-invalid={Boolean(errors.displayName)}
                        className={inputClass}
                        placeholder="Shown on the leaderboard"
                      />
                    </Field>

                    <div className="grid gap-x-4 sm:grid-cols-2">
                      <Field
                        id="signup-password"
                        label="Password"
                        hint="min 6"
                        error={errors.password}
                      >
                        <input
                          id="signup-password"
                          name="password"
                          type="password"
                          autoComplete="new-password"
                          value={values.password}
                          onChange={(event) =>
                            handleChange("password", event.target.value)
                          }
                          onBlur={() => handleBlur("password")}
                          aria-invalid={Boolean(errors.password)}
                          className={inputClass}
                          placeholder="••••••"
                        />
                      </Field>

                      <Field
                        id="signup-confirm"
                        label="Confirm"
                        error={errors.confirm}
                      >
                        <input
                          id="signup-confirm"
                          name="confirm"
                          type="password"
                          autoComplete="new-password"
                          value={values.confirm}
                          onChange={(event) =>
                            handleChange("confirm", event.target.value)
                          }
                          onBlur={() => handleBlur("confirm")}
                          aria-invalid={Boolean(errors.confirm)}
                          className={inputClass}
                          placeholder="••••••"
                        />
                      </Field>
                    </div>

                    {formError ? (
                      <p
                        role="alert"
                        className="mt-1 rounded-[3px] border border-[#bf5741]/30 bg-[#bf5741]/10 px-3 py-2 font-mono text-[10px] text-[#ee917c]"
                      >
                        {formError}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={busy}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-[13px] font-semibold text-ink transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                    >
                      {busy ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border border-ink/25 border-t-ink" />
                          Creating account…
                        </>
                      ) : sessionUser?.isGuest ? (
                        "Create account & keep progress"
                      ) : (
                        "Create account"
                      )}
                    </button>
                  </form>
                )}

                <div className="mt-6 flex items-center gap-3">
                  <span className="h-px flex-1 bg-paper/10" aria-hidden="true" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-paper/25">
                    or
                  </span>
                  <span className="h-px flex-1 bg-paper/10" aria-hidden="true" />
                </div>

                <button
                  type="button"
                  onClick={handleGuest}
                  disabled={busy}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-paper/20 px-5 py-3 text-[13px] font-medium text-paper/80 transition-colors hover:border-paper/40 hover:text-paper disabled:cursor-wait disabled:opacity-60"
                >
                  Continue as guest
                </button>

                <p className="mt-4 text-center font-mono text-[8px] uppercase leading-relaxed tracking-[0.14em] text-paper/25">
                  Demo accounts live in this browser only
                </p>
              </section>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
