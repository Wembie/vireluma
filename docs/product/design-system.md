# Design system

Living reference: `/design-system/` (noindex). Source: `apps/web/src/components/ui/`.

## Tokens (`apps/web/src/styles/tokens.css`)

Three layers:

1. **Primitives** `--vl-navy-900`, `--vl-teal-700`, … — raw brand values, never used in components.
2. **Semantic** `--vl-bg`, `--vl-surface`, `--vl-fg`, `--vl-fg-muted`, `--vl-primary`,
   `--vl-on-primary`, `--vl-border-strong`, `--vl-focus`, `--vl-success|warning|danger|info(-soft)`,
   `--vl-disabled-*` … — redefined for dark mode.
3. **Tailwind mapping** (`global.css`, `@theme inline`) — utilities exist only for semantic tokens:
   `bg-surface`, `text-fg-muted`, `border-border-strong`, `bg-primary text-on-primary`.

Also: fluid type scale (`text-display`, `text-h1…h4`, `text-lg/base/sm/caption`), spacing
(`--vl-space-section`, `--vl-gutter`, `--vl-container`), radius, shadow, z-index layers, motion
durations/easing, control heights and `--vl-touch-min` (44 px).

**Contrast is tested.** `tokens.test.ts` asserts every text/background pair meets 4.5:1 and UI
boundaries/focus 3:1 in both themes, and that the two dark-theme blocks stay identical.

Rules:

- Muted text (`text-fg-muted`) only on `bg` or `surface`. On tinted surfaces (`subtle`, `accent`,
  soft feedback colours) use `text-fg`.
- Gold is never text on light backgrounds.
- Never hardcode hex values in components (exceptions: brand renders such as the wristband and the
  phone preview, which always show the light emergency UI).

## Themes

`<html data-theme="light|dark">` resolved before first paint from the saved preference
(`localStorage` key `vireluma-theme`: `light` | `dark`; absent = system). Without JavaScript, the
system preference applies via `prefers-color-scheme`.

## Components

| Component                                 | Kind  | Notes                                                                                                                                |
| ----------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Button / IconButton                       | Astro | variants primary, secondary, outline, ghost, danger, inverse; sm/md/lg; loading (`aria-busy`), disabled; IconButton requires `label` |
| Badge                                     | Astro | tones; optional dot (meaning never by colour alone)                                                                                  |
| Alert                                     | Astro | info/success/warning/danger; `live` for dynamic messages                                                                             |
| Card                                      | Astro | default/subtle/accent/brand; `interactive` for whole-card links                                                                      |
| FormField + Input/Textarea/Select         | Astro | label, hint and error wired with `aria-describedby` / `aria-invalid`                                                                 |
| Checkbox / RadioGroup / Switch            | Astro | native inputs; Switch uses `role="switch"`; RadioGroup in a fieldset                                                                 |
| Avatar                                    | Astro | photo or initials; decorative mode                                                                                                   |
| Progress                                  | Astro | determinate/indeterminate `progressbar`                                                                                              |
| Stepper                                   | Astro | `aria-current="step"`; completed state announced                                                                                     |
| StateView                                 | Astro | empty / loading (`status`) / error (`alert`)                                                                                         |
| Breadcrumbs                               | Astro | `nav` + `aria-current="page"`                                                                                                        |
| Accordion                                 | Astro | native `<details>`                                                                                                                   |
| Tooltip                                   | Astro | hover + focus, Escape dismisses (WCAG 1.4.13)                                                                                        |
| Dialog                                    | Astro | native `<dialog>.showModal()`; focus returns to opener                                                                               |
| Tabs                                      | React | APG pattern, roving tabindex, Arrow/Home/End                                                                                         |
| Toast                                     | React | polite/assertive live regions, pause on hover/focus                                                                                  |
| Navigation, LanguageSwitcher, ThemeToggle | Astro | `<details>` disclosures enhanced by `scripts/disclosure.ts`                                                                          |

Planned with real data shapes (M3): Drawer, Dropdown menu, QRPreview, EmergencyContactCard,
ProfileSummary, DeviceCard, PermissionEditor.

Add a component: implement it in `components/ui`, use semantic tokens only, cover default /
hover / focus-visible / active / disabled (+ loading/error where relevant), add it to the showcase,
and extend `e2e/design-system.spec.ts` if it has behaviour.
