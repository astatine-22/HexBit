# HexBit — CodeMentor

A vinyl-shelf coding practice app: browse challenges as record pressings, read the
brief, then solve them in a split Monaco workspace with a mentor on standby.

Built with Next.js (App Router) and Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the root redirects to `/challenges`.

## Structure

- `app/` — routes: shelf (`/challenges`), detail (`/challenges/[id]`),
  workspace (`/challenges/[id]/solve`), progress, about
- `components/` — shelf carousel, code preview, solver workspace, mentor panel
- `lib/challenges.js` — the only challenge data source (`getChallenges`,
  `getChallengeById`)
- `lib/executor.js` — the only `runCode(language, code)` adapter
- `lib/mentor.js` — hint and recommendation integration points
- `lib/progress.js` — solved-state adapter (localStorage today)
- `pages/api/` — legacy Judge0-backed `run` / `check` endpoints

## Mocked behaviour

Everything runs locally: no auth, no network calls, no real code execution.
`runCode` reads simple printed literals so the workspace has believable output,
and a challenge is marked solved when the trimmed stdout matches the expected
output. Hints and recommendations are local mocks. Each seam carries a TODO for
the real integration (Piston through a Next.js API route, `/api/hint`,
`/api/recommendation`, and Supabase for challenge data and progress).
