# Supabase production project

One cloud project, `vireluma`, is production (ADR-0006). Development uses the local Docker stack
and ephemeral CI databases. Public values live in repository variables `SUPABASE_URL` and
`SUPABASE_PUBLISHABLE_KEY`; they are injected only into `main` builds.

## Project creation settings (done)

- Data API: enabled · Automatically expose new tables: **disabled** · Automatic RLS: **enabled**
- No GitHub integration (migrations go through reviewed PRs and GitHub Actions).
- Region: "Americas" group — record the exact region (Project Settings → General) here:
  `TODO(owner): region` and in the compliance matrix. International transfer under Ley 1581 needs
  legal review before real data.

## Dashboard settings to apply (owner, once)

`supabase/config.toml` holds the same security values for the local stack. Production does not
read that file; set these in the dashboard:

**Authentication → URL Configuration**

- Site URL: `https://wembie.github.io/vireluma/`
- Redirect URLs: `https://wembie.github.io/vireluma/**`

**Authentication → Sign In / Providers → Email**

- Confirm email: **on**
- Secure email change (double confirm): **on**
- Secure password change (recent sign-in required): **on**
- Minimum password length: **12**
- Leaked password protection: **on** if your plan offers it

**Authentication → Providers:** disable everything except Email (no anonymous sign-ins).

**Authentication → Rate Limits:** keep defaults or stricter; review email sending limits before
launch (the default email provider is for testing only — configure a real SMTP provider before
inviting real families).

**Data API:** exposed schemas `public` only (remove `graphql_public` if listed); max rows 100.

**Realtime:** not used — no tables should be added to publications.

## Applying migrations (M2, next step)

A `deploy-database` job will run on `main` in the `production` environment (required reviewer)
with secrets `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD`:
`supabase link` → `supabase db push --dry-run` → approval → `supabase db push`. Until that job
exists, **do not** run `db push` from a laptop against production.

## Before real families use it

- Upgrade to a paid plan (free projects pause after inactivity; backups/PITR limited).
- Real SMTP provider with SPF/DKIM for verification and invitation emails.
- Legal review of region/data transfer, privacy notice and consent texts.
