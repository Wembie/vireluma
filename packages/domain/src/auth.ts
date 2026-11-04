/**
 * Authentication port. The UI depends on this interface; the Supabase adapter
 * in apps/web implements it (ADR-0006). Provider error messages never reach
 * users: adapters map them to these codes, which the UI translates.
 */

export const AUTH_ERROR_CODES = [
  'not_configured',
  'invalid_credentials',
  'email_not_confirmed',
  'weak_password',
  'invalid_email',
  'rate_limited',
  'link_invalid',
  'network',
  'unknown',
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

export type AuthResult<T = void> = { ok: true; value: T } | { ok: false; error: AuthErrorCode };

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthPort {
  /** Always resolves as success for unknown/duplicate emails (no account enumeration). */
  signUp(email: string, password: string, locale: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult<AuthUser>>;
  signOut(scope: 'local' | 'global'): Promise<AuthResult>;
  /** Always resolves as success, whether or not the account exists. */
  requestPasswordReset(email: string): Promise<AuthResult>;
  updatePassword(password: string): Promise<AuthResult>;
  /** Completes an email link (confirmation or recovery). */
  completeEmailLink(code: string): Promise<AuthResult>;
  currentUser(): Promise<AuthUser | null>;
  requestAccountDeletion(): Promise<AuthResult>;
}

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 72; // bcrypt limit used by the auth server

/** Client-side checks mirror the server; the server remains the authority. */
export function validatePassword(password: string): AuthErrorCode | null {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) return 'weak_password';
  return null;
}

export function validateEmail(email: string): AuthErrorCode | null {
  const value = email.trim();
  // Deliberately simple and linear: one "@", no spaces, a dot in the domain.
  const at = value.indexOf('@');
  if (value.length > 254 || at < 1 || at !== value.lastIndexOf('@') || /\s/.test(value)) {
    return 'invalid_email';
  }
  const domain = value.slice(at + 1);
  if (domain.length < 3 || !domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
    return 'invalid_email';
  }
  return null;
}

/** Pages an email link may continue to. Anything else is ignored (no open redirects). */
export const EMAIL_LINK_DESTINATIONS = ['account', 'reset-password'] as const;
export type EmailLinkDestination = (typeof EMAIL_LINK_DESTINATIONS)[number];

export function parseEmailLinkDestination(value: string | null): EmailLinkDestination {
  return (EMAIL_LINK_DESTINATIONS as readonly string[]).includes(value ?? '')
    ? (value as EmailLinkDestination)
    : 'account';
}
