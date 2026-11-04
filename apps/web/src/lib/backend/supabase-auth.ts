import { AuthClient, type AuthError, type GoTrueClient } from '@supabase/auth-js';
import type { AuthErrorCode, AuthPort, AuthResult, AuthUser } from '@vireluma/domain';
import { SUPABASE_KEY as key, SUPABASE_URL as url, backendConfigured } from './config';

/**
 * Supabase adapter for the AuthPort. Only the project URL and the publishable
 * key reach the browser (both public by design); data is protected by RLS.
 *
 * Uses the standalone auth client instead of the full supabase-js bundle
 * (no realtime/storage/functions) to keep the account area light on phones.
 */

export { backendConfigured };

let client: GoTrueClient | null = null;

export function getSupabase(): GoTrueClient | null {
  if (!backendConfigured || typeof window === 'undefined') return null;
  client ??= new AuthClient({
    url: `${url}/auth/v1`,
    headers: { apikey: key },
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    // Email links are completed explicitly on the callback page.
    detectSessionInUrl: false,
    storageKey: 'vireluma-auth',
  });
  return client;
}

/** Current access token (refreshed by the auth client when close to expiry), or null. */
export async function accessToken(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.getSession();
  return data.session?.access_token ?? null;
}

/** Calls a Postgres RPC through the Data API as the signed-in user (POST keeps args out of URLs). */
async function rpc(fn: string, args: Record<string, unknown> = {}): Promise<boolean> {
  const token = await accessToken();
  if (!token) return false;
  const response = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  return response.ok;
}

const ERROR_MAP: Record<string, AuthErrorCode> = {
  invalid_credentials: 'invalid_credentials',
  email_not_confirmed: 'email_not_confirmed',
  weak_password: 'weak_password',
  email_address_invalid: 'invalid_email',
  validation_failed: 'invalid_email',
  over_request_rate_limit: 'rate_limited',
  over_email_send_rate_limit: 'rate_limited',
  flow_state_not_found: 'link_invalid',
  flow_state_expired: 'link_invalid',
  bad_code_verifier: 'link_invalid',
  otp_expired: 'link_invalid',
  same_password: 'weak_password',
};

function mapError(error: AuthError | Error | null | undefined): AuthErrorCode {
  if (!error) return 'unknown';
  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';
  if (code in ERROR_MAP) return ERROR_MAP[code] ?? 'unknown';
  if ('status' in error && error.status === 429) return 'rate_limited';
  if (error.name === 'AuthRetryableFetchError' || /fetch|network/i.test(error.message)) return 'network';
  return 'unknown';
}

const ok = <T>(value: T): AuthResult<T> => ({ ok: true, value });
const fail = (error: AuthErrorCode): AuthResult<never> => ({ ok: false, error });

async function guard<T>(run: (sb: GoTrueClient) => Promise<AuthResult<T>>): Promise<AuthResult<T>> {
  const sb = getSupabase();
  if (!sb) return fail('not_configured');
  try {
    return await run(sb);
  } catch (error) {
    return fail(mapError(error instanceof Error ? error : null));
  }
}

export function createSupabaseAuth(callbackUrl: (next: 'account' | 'reset-password') => string): AuthPort {
  return {
    signUp: (email, password, locale) =>
      guard(async (sb) => {
        const { error } = await sb.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: callbackUrl('account'), data: { locale } },
        });
        // With email confirmation on, duplicates also return success (no enumeration).
        return error ? fail(mapError(error)) : ok(undefined);
      }),

    signIn: (email, password) =>
      guard(async (sb) => {
        const { data, error } = await sb.signInWithPassword({ email: email.trim(), password });
        if (error || !data.user) return fail(mapError(error));
        return ok<AuthUser>({ id: data.user.id, email: data.user.email ?? '' });
      }),

    signOut: (scope) =>
      guard(async (sb) => {
        const { error } = await sb.signOut({ scope });
        return error ? fail(mapError(error)) : ok(undefined);
      }),

    requestPasswordReset: (email) =>
      guard(async (sb) => {
        const { error } = await sb.resetPasswordForEmail(email.trim(), {
          redirectTo: callbackUrl('reset-password'),
        });
        // Rate limits are worth telling the user; anything else is reported as sent.
        if (error && mapError(error) === 'rate_limited') return fail('rate_limited');
        return ok(undefined);
      }),

    updatePassword: (password) =>
      guard(async (sb) => {
        const { error } = await sb.updateUser({ password });
        return error ? fail(mapError(error)) : ok(undefined);
      }),

    completeEmailLink: (code) =>
      guard(async (sb) => {
        const { error } = await sb.exchangeCodeForSession(code);
        return error ? fail(mapError(error) === 'unknown' ? 'link_invalid' : mapError(error)) : ok(undefined);
      }),

    currentUser: async () => {
      const sb = getSupabase();
      if (!sb) return null;
      // getUser() validates the session with the auth server (not just local storage).
      const { data } = await sb.getUser();
      return data.user ? { id: data.user.id, email: data.user.email ?? '' } : null;
    },

    requestAccountDeletion: () =>
      guard(async () => ((await rpc('request_account_deletion')) ? ok(undefined) : fail('unknown'))),
  };
}
