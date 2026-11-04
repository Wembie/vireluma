# Accessibility guidelines

Target: **WCAG 2.2 AA** everywhere; the emergency page aims higher where practical for older
adults and people under stress.

## Automated gates (CI)

- `tokens.test.ts` — colour pairs ≥ 4.5:1 (text) / 3:1 (UI, focus) in light and dark.
- Playwright + axe-core (`wcag2a/aa`, `wcag21aa`, `wcag22aa`) on every public page, mobile and
  desktop, plus dark mode and the design-system showcase.
- Overflow test at mobile widths; Lighthouse accessibility ≥ 95.
- `eslint-plugin-jsx-a11y-x` (strict) and `eslint-plugin-astro` a11y rules.

Automated checks catch roughly a third of issues. Manual checks are required before each release:

## Manual checklist

- [ ] Keyboard only: every action reachable, logical order, visible focus, no traps, skip link works
- [ ] Screen reader smoke test: NVDA + Firefox/Chrome (Windows), VoiceOver + Safari (iOS/macOS),
      TalkBack (Android) on home and one inner page
- [ ] 200 % and 400 % zoom (reflow at 320 CSS px) without loss of content
- [ ] Touch targets ≥ 44 × 44 px (`--vl-touch-min`); spacing between adjacent targets
- [ ] `prefers-reduced-motion` respected; no flashing content
- [ ] Forms: visible labels, hints linked, errors in text (not colour only) and announced
- [ ] Language: `lang` on `<html>` and on inline foreign-language text
- [ ] Headings: one `h1`, no skipped levels
- [ ] Images/icons: decorative icons `aria-hidden`; meaningful images have alt text

## Patterns we rely on

Native elements first: `<details>`, `<dialog>`, `<select>`, radio/checkbox inputs. ARIA only when
no native element exists (tabs, switch role, live regions), following the WAI-ARIA APG.
