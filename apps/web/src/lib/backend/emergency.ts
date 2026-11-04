import { parseEmergencyResolution, type EmergencyResolution, type PublicId } from '@vireluma/domain';
import { SUPABASE_KEY, SUPABASE_URL, backendConfigured, fetchWithTimeout } from './config';

export type ResolveOutcome = EmergencyResolution | { status: 'network' } | { status: 'not_configured' };

/**
 * Resolves a public identifier anonymously. POST keeps the identifier out of
 * URLs and access logs; the response is never cached or stored. Network
 * failures are retried twice with backoff because a helper may be on a weak
 * signal; definitive answers (including "not found") are never retried.
 */
export async function resolveEmergencyProfile(id: PublicId): Promise<ResolveOutcome> {
  if (!backendConfigured) return { status: 'not_configured' };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/rpc/resolve_emergency_profile`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_public_id: id }),
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      if (response.status === 429) return { status: 'rate_limited' };
      if (response.ok) return parseEmergencyResolution(await response.json());
      if (response.status < 500) return { status: 'malformed' };
    } catch {
      // Timeout or offline: retry below.
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 600 * 2 ** attempt));
  }
  return { status: 'network' };
}
