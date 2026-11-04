# VIRELUMA brand guidelines

**Tagline:** _Every life deserves to be found._ (es: _Cada vida merece ser encontrada._ ·
pt: _Toda vida merece ser encontrada._ · fr: _Chaque vie mérite d’être retrouvée._)

Personality: human, trustworthy, warm, calm, premium, accessible, international. Never fear-based,
never clinical, never government-like.

## The symbol

Two tapered forms grow from a single root — the person, and the one who helps — leaving a rising
channel of negative space that ends in a point of light. It reads as a **V**, as two hands, and as
a figure reaching up: _connection → finding → light (lumen)_. It deliberately avoids shields, pins,
hearts, crosses and QR motifs.

Construction (256-unit grid, `scripts/brand/build-logos.mjs`):

- Left form: `M128 222 Q26 176 54 40 Q108 124 128 222 Z` · right form mirrored about x = 128.
- Light: circle r = 22 at (128, 60).
- Visual bounds: 160 × 184 units.

Colour roles: left form **Deep Navy** (the person), right form **Primary Teal** (the helper),
light **Warm Gold**. Reversed (on navy): white, **Soft Mint**, gold.

## Wordmark and lockups

Wordmark: **Manrope Bold**, tracking +6 %, all caps, outlined to paths (no font dependency).
Source: `brand/source/wordmark.json` (Manrope is licensed under the SIL Open Font License 1.1).

- Horizontal: symbol + wordmark; cap height = 40 % of symbol height; gap = 32 % of symbol width.
- Vertical: symbol above wordmark, gap = 22 % of symbol height.

## Files (`apps/web/public/brand/`)

| Need                                      | File                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| Default (light backgrounds)               | `logo/vireluma-horizontal.svg`                                                  |
| Dark / navy backgrounds                   | `logo/vireluma-horizontal-white.svg`                                            |
| One colour (print, engraving, embroidery) | `logo/vireluma-horizontal-mono-{navy,black,white}.svg`                          |
| Symbol only                               | `logo/vireluma-symbol*.svg`                                                     |
| Stacked                                   | `logo/vireluma-vertical*.svg`                                                   |
| Raster for documents                      | `logo/png/*`, `logo/webp/*`                                                     |
| Favicon / app icons                       | `icons/favicon.{svg,ico}`, `icons/icon-*.png`, `apple-touch-icon.png`, maskable |
| Social                                    | `social/social-preview.png` (1200×630), `social/avatar-400.png`                 |

SVGs are the masters. Regenerate everything with:
`node scripts/brand/build-logos.mjs && pnpm brand:export`.

## Rules

- **Clear space:** at least the diameter of the light (the gold circle) on every side.
- **Minimum size:** symbol 16 px on screen (use the navy-tile favicon below 24 px), 6 mm in print;
  horizontal lockup 96 px wide / 25 mm.
- **Backgrounds:** colour version on white/Snow; reversed on Deep Navy; one-colour versions on
  photos or busy surfaces only with sufficient contrast.
- **Do not:** recolour outside the palette, add gradients/shadows/outlines, rotate, stretch,
  rearrange the forms, change the wordmark typeface or spacing, place the colour version on navy,
  or use emoji as the logo.

## Palette

| Colour       | Hex       | Role                                                   |
| ------------ | --------- | ------------------------------------------------------ |
| Deep Navy    | `#102A43` | Brand surfaces, headings, navigation                   |
| Primary Teal | `#0F766E` | Actions, links, active states                          |
| Soft Mint    | `#8FE1D4` | Accents on navy; primary colour in dark mode           |
| Warm Gold    | `#F4B860` | The light — small highlights only, never text on white |
| Snow         | `#F7FAFC` | Light background                                       |

Supporting: White `#FFFFFF`, Text `#172B3A`, Secondary text `#64748B`, Border `#E2E8F0`,
Success `#15803D`, Warning `#D97706` (warning _text_ uses `#B45309` for AA), Danger `#B91C1C`.

## Imagery and illustration (to be produced)

Authentic, dignified people: older adults being independent, caregivers, children with guardians,
hands and wristbands, phones scanning. No stereotypes, no fear imagery. Illustrations reuse the
symbol's tapered-leaf geometry and the palette; one style only. Icons: Lucide, 1.75–2 px stroke.

## Trademark

The name and logo are not covered by the MIT code license. Trademark clearance has not been
performed — required before commercial launch.
