# ADR-0011 — Account app data access and emergency page rendering

Status: Accepted · 2026-11-04

## Context

M3 adds the core product on a static host (GitHub Pages, ADR-0002): an account area where
families manage people, and the public emergency page that strangers open by scanning a code.
The two have opposite constraints:

- The **emergency page** is opened in a hurry, by anyone, often on an old phone with a weak
  signal. It must be fast, readable in the helper's language, and must never leak private data.
- The **account area** is used by signed-in members on many screens with rich forms; it must stay
  responsive on low-end Android devices and never trust the client for authorization.

Static hosting means no server-side routes for dynamic ids and no response headers.

## Decision

1. **One static shell per account page**, one React island per page (`client:load`). Person-scoped
   pages take `?id=<uuid>`: an internal key, protected by RLS, never personal data. The emergency
   URL contract (`/p/#ID`, ADR-0004) is unchanged.
2. **No supabase-js in the browser.** Auth uses the standalone `@supabase/auth-js` client; data
   uses a ~3 KB typed PostgREST client (`apps/web/src/lib/backend/data.ts`) that maps Postgres
   error codes to user-facing categories. Budget: 110 KB gzip of JS per account page (heaviest
   today ≈ 77 KB).
3. **One database call per screen.** Reads go through SECURITY DEFINER read models
   (`list_my_people`, `get_person_workspace`, `get_person_activity`) that check membership
   themselves; activity uses keyset pagination. Writes use RLS-guarded tables or RPCs. After a
   write the screen re-reads its read model (simple, consistent); only reordering is optimistic.
4. **No caching of private data** in Service Workers or browser storage. Local storage holds only
   the session (auth client), the theme, and a pending invitation token until it is used.
5. **The emergency page has no framework.** A plain TypeScript renderer (~3 KB gzip) inserts
   network values only through `textContent`/attributes, validates the response with
   `parseEmergencyResolution`, negotiates the language from `navigator.languages` (all four
   dictionaries ship inline), sets `referrer=no-referrer`, preconnects to the API, retries network
   failures with backoff and never retries definitive answers. Location is read only when the
   helper presses a button and is used only to prefill the helper's own SMS/WhatsApp message.
6. **Server-side setup drafts.** A person is created on the first step; the remaining setup steps
   are derived from server data (`setupProgress`), so setup resumes on any device and nothing is
   lost in a closed tab.
7. **Invitations by link.** `create_invitation` returns a one-time token shown once; it travels
   in the URL fragment (`/app/invite/#token`) and is bound to the invitee's confirmed email. No
   email provider is required.

## Consequences

- Each account page loads only its own code; the emergency page stays fast on any phone.
- Authorization lives entirely in Postgres; UI permission checks only hide controls.
- Re-reading after writes costs one extra request per change — acceptable at family scale and
  simpler than client caches. Revisit if profiles grow beyond the per-person limits.
- Without headers on GitHub Pages there is no CSP yet; mitigated by never rendering HTML from
  data. A CSP comes with the domain migration (ADR-0002).

## Alternatives

- **supabase-js everywhere**: simpler code, ~30 KB more per page and realtime/storage code we do
  not use.
- **React (or Preact) on the emergency page**: shared components, but 10–40 KB more on the most
  time-critical page.
- **Client-side drafts in storage**: lost across devices and risky on shared phones.
- **Email invitations**: need an SMTP provider and a template pipeline; links work now and the
  same RPC can feed email later.
