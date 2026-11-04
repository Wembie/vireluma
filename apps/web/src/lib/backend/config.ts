/**
 * Backend coordinates for this build. Both values are public by design (the
 * publishable key only identifies the project; data is protected by RLS).
 * Kept free of SDK imports so the emergency page can use it without pulling
 * the auth client into its bundle.
 */
export const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_KEY = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const backendConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Fetch with a deadline: slow mobile networks must fail visibly, not hang. */
export async function fetchWithTimeout(input: string, init: RequestInit, ms = 10_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
