import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Abort any Supabase request that hangs for more than 8 seconds so a slow
// Supabase can never freeze a demo.
const SUPABASE_TIMEOUT_MS = 8000;

// Null when the Supabase env vars are missing — callers must degrade
// gracefully instead of crashing (see pages/api/progress.js).
export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
        global: {
          fetch: (input, init) =>
            fetch(input, { ...init, signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS) }),
        },
      })
    : null;

export function isSupabaseConfigured() {
  return Boolean(supabase);
}
