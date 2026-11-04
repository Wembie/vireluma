# Internationalization

Routing decisions: [ADR-0007](../adr/0007-i18n-routing.md).

## Locales and routes

| Key          | es                            | en                          | pt                             | fr                                 |
| ------------ | ----------------------------- | --------------------------- | ------------------------------ | ---------------------------------- |
| `home`       | `/es/`                        | `/en/`                      | `/pt/`                         | `/fr/`                             |
| `howItWorks` | `/es/como-funciona/`          | `/en/how-it-works/`         | `/pt/como-funciona/`           | `/fr/comment-ca-marche/`           |
| `useCases`   | `/es/casos-de-uso/`           | `/en/use-cases/`            | `/pt/casos-de-uso/`            | `/fr/cas-d-usage/`                 |
| `qrNfc`      | `/es/qr-y-nfc/`               | `/en/qr-and-nfc/`           | `/pt/qr-e-nfc/`                | `/fr/qr-et-nfc/`                   |
| `security`   | `/es/seguridad-y-privacidad/` | `/en/security-and-privacy/` | `/pt/seguranca-e-privacidade/` | `/fr/securite-et-confidentialite/` |
| `faq`        | `/es/preguntas-frecuentes/`   | `/en/faq/`                  | `/pt/perguntas-frequentes/`    | `/fr/faq/`                         |

Source of truth: `apps/web/src/i18n/routes.ts`. Published slugs are part of the URL contract.

## Dictionaries

- `apps/web/src/i18n/dictionaries/{es,en,pt,fr}.ts`; Spanish is the source shape.
- TypeScript enforces the shape; `i18n.test.ts` enforces identical keys and list lengths, no empty
  strings, no placeholders, and meta-description length.
- Add a string: add it to `es.ts`, then to every other locale (the build fails otherwise).
- Add a locale: add it to `LOCALES` in `@vireluma/domain`, create the dictionary and slugs, extend
  `HTML_LANG` and `ogLocale`, and review the font subsets (Inter/Manrope latin-ext cover es/pt/fr).

## Formatting (M2+)

Use `Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.RelativeTimeFormat` with the active locale;
store timestamps in UTC; phone numbers in E.164 with libphonenumber-style validation on the server.
Never assume an emergency number: the country registry stores number, source, verification date
and review status, and falls back to safe generic guidance when unverified.

## Translation quality and review status

All M1 copy was written in the four languages for this release. Variants: pt-BR spelling, fr-FR,
es neutral Latin American, en-US.

| Area                                                                                          | es  | en  | pt  | fr  | Native review required before launch |
| --------------------------------------------------------------------------------------------- | --- | --- | --- | --- | ------------------------------------ |
| Marketing pages                                                                               | ✔   | ✔   | ✔   | ✔   | recommended                          |
| Emergency-critical strings (disclaimer, sample emergency page, "call local emergency number") | ✔   | ✔   | ✔   | ✔   | **mandatory**                        |
| Legal text                                                                                    | —   | —   | —   | —   | qualified legal translation          |
