# Data retention (draft — pending legal review)

Status: engineering draft. Retention periods must be confirmed by qualified legal review
(Ley 1581 de 2012 first; GDPR/LGPD when those markets open) before real data is stored.

| Data                      | Kept while                               | After                                                                                     |
| ------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Account                   | Account active                           | Deleted on processed deletion request                                                     |
| Person and emergency info | Person exists                            | Hard-deleted with the person (cascade)                                                    |
| Health details            | Health-data consent active               | Deleted immediately when consent is revoked                                               |
| Revoked identifiers       | Person exists                            | Deleted with the person; keep history for audit                                           |
| Consent records           | Person exists                            | Deleted with the person — **legal review: may need longer retention as proof of consent** |
| Invitations               | Until accepted/revoked/expired (7 days)  | Purged daily (`pg_cron`) 90 days after acceptance, revocation or expiry                   |
| Audit logs                | Pseudonymous (IDs and column names only) | Purged daily after 24 months (proposed) — **legal review**                                |
| Scan events               | No IP / user agent                       | Purged daily after 12 months (proposed) — **legal review**                                |

## Account deletion

`request_account_deletion()` records a pending request. Processing (M3) must:

1. For each person the account **owns**: transfer ownership to another member if one accepts, or
   delete the person after notifying co-members.
2. Delete the auth user (cascades memberships and the account profile).
3. Mark the request completed. Target: within 30 days (confirm with legal).
