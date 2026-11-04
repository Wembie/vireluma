# UI/UX guidelines

## Principles

1. **Comprehension over decoration** — especially on the emergency page.
2. **Calm, not alarming** — warm language, no fear tactics, no fake urgency.
3. **Honest** — never show a feature that does not work; label examples as examples; state what
   VIRELUMA is not (it does not replace emergency services).
4. **Private by default** — show the minimum; never fill space with personal data.
5. **One system** — every surface derives from the tokens and components; no page-specific colours
   or fonts.

## Layout

- Mobile first. Test at 320, 360, 390, 430, 768, 1024, 1280, 1440, 1920 px and ultrawide.
  No horizontal overflow (E2E asserts it).
- Container max 76 rem with fluid gutters; sections use `--vl-space-section`.
- Desktop navigation from 1280 px; below, a disclosure menu with large targets.

## Content

- Short sentences, plain language (target: understandable by a stressed bystander).
- Buttons say what happens ("See how it works", "Call María"), never "Click here".
- No string concatenation across languages; every locale gets complete sentences.

## Emergency page (M3) priorities, in order

1. Who this person is (preferred name, photo only if authorised).
2. What to do now (message + instructions).
3. Call actions (contacts; verified local emergency number or a safe generic fallback).
4. Authorised alerts.
5. Language selector.
   Nothing else above the fold. Large type (≥ 18 px body), ≥ 48 px buttons, works offline-degraded.

## Motion

Subtle (120–360 ms, ease-out) for disclosure, dialogs, cards and toasts. Respect
`prefers-reduced-motion` globally. Never convey information only through motion.

## States

Every data view designs its empty, loading and error states (`StateView`) and an offline/connection
error state before the happy path is considered done.
