/**
 * Code execution adapter.
 *
 * Calls the production backend (pages/api/run.js + pages/api/check.js) instead
 * of the local mock. Keeps the same return shape the workspace expects:
 * { stdout, stderr, success, executionTime, mocked }.
 */

export async function runCode(language, code, challenge) {
  const startedAt = Date.now();

  const res = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language,
      code,
      challengeId: challenge?.slug ?? challenge?.id,
    }),
  });

  const result = await res.json();

  let passed = false;

  if (result?.success) {
    const checkRes = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stdout: result?.stdout ?? "",
        expectedOutput: challenge?.expectedOutput ?? "",
      }),
    });
    const check = await checkRes.json();
    passed = Boolean(check?.passed);
  }

  return {
    stdout: result?.stdout ?? "",
    stderr: result?.stderr ?? "",
    success: passed,
    executionTime: Date.now() - startedAt,
    mocked: false,
  };
}
