# Threat model (initial — M1)

Method: STRIDE per asset, prioritised by impact on people's safety. Reviewed at each milestone;
full review in M5. Reference standards: OWASP ASVS (verification), OWASP Top 10 (taxonomy).

## Assets

| Asset                                | Sensitivity | Notes                                                        |
| ------------------------------------ | ----------- | ------------------------------------------------------------ |
| Health / medical alerts              | Very high   | Special-category data (GDPR art. 9; Ley 1581 sensitive data) |
| Data of minors                       | Very high   | Guardian authorization required                              |
| Emergency contacts (third-party PII) | High        | Contacts did not sign up themselves                          |
| Public identifiers                   | Medium      | Bearer-like: whoever has it sees public fields               |
| Accounts / sessions                  | High        | Takeover exposes whole families                              |
| Build pipeline / deploy credentials  | High        | Supply chain                                                 |

## Key threats and mitigations

| Threat                                            | Mitigation (status)                                                                                              |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Enumeration of profiles via QR IDs                | 130-bit random IDs (done); rate limiting + abuse detection on resolver (M2/M3)                                   |
| ID leakage via logs/Referer                       | Fragment URL `/p/#ID` (ADR-0004); POST to backend; `no-referrer` on `/p/` (M3)                                   |
| Search engines indexing personal data             | `noindex` + excluded from sitemap + robots (done); no SSR of profiles                                            |
| Broken access control / IDOR across families      | RLS on all tables, pgTAP cross-tenant tests, no UI-only checks (M2)                                              |
| Service-role key exposure                         | Never in frontend/artifacts; gitleaks + push protection (done); env secrets (M2)                                 |
| XSS → session theft                               | Astro escapes by default; no `set:html` with user data; CSP after domain move (gap)                              |
| Missing security headers on GitHub Pages          | **Known gap** until migration to an edge host (ADR-0002)                                                         |
| Stalking: abuser registers someone else's profile | Consent records, guardian verification design, report/suspend flow (M3)                                          |
| Stale/incorrect emergency numbers                 | Country registry stores source, verification date, review status; safe fallback (M2)                             |
| Dependency / action compromise                    | Lockfile, `minimumReleaseAge`, build-script allow-list, Dependabot, pinned majors, least-privilege tokens (done) |
| Workflow script injection                         | No `${{ }}` of user-controlled values inside `run:`; env indirection (done)                                      |
| Malicious production deploy                       | Deploy only from `main`, environment branch policy, required checks (owner setup)                                |
| DoS of emergency resolver                         | CDN-cached static shell; backend rate limits; graceful offline/error states (M3)                                 |
| Sensitive data in telemetry                       | No analytics in M1; privacy-safe logging policy before any telemetry (M6)                                        |

## Out of scope (for now)

Native apps, BLE/GPS integrations, offline caching of private data.
