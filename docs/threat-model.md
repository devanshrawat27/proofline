# Threat model (initial)

Scope: the Phase 1 foundation, extended as features land. This is a working
document, not a certification.

## Assets

- Tenant business data (organizations, members, and later POs, receipts, invoices, cases).
- Uploaded documents (later) — potentially sensitive commercial information.
- Credentials and session tokens.
- Financial resolution records (later).

## Primary threats and controls

| Threat | Control |
| --- | --- |
| Cross-tenant data access | Organization scope enforced in services; global auth guard resolves the caller's tenant; negative tests for cross-tenant access. |
| Cross-supplier access (later) | Supplier scoping checked against the authenticated supplier identity. |
| Session theft | HttpOnly + SameSite=Lax cookie; `Secure` in production; short-ish TTL; server-side revocation; tokens stored only as hashes. |
| Password attacks | bcrypt hashing (cost 12); generic login errors to reduce enumeration; rate limiting planned for auth endpoints. |
| CSRF | SameSite=Lax cookies + Origin allowlist check on non-idempotent methods (defence in depth). |
| Privilege escalation | Server-side RBAC on every protected route; UI hiding is never the control. |
| Injection | Prisma parameterized queries; Zod validation at the boundary. |
| Secret leakage | Secrets only in env; `.env` gitignored; startup fails on default `SESSION_SECRET` in production; no secrets in logs. |
| Information disclosure | Consistent error body, no stack traces to clients; request IDs for correlation. |
| Malicious uploads (later) | Allowlisted MIME + content sniffing, size limits, random storage keys, private storage with short-lived signed URLs, never execute uploads. |
| AI prompt injection (later) | Document text is untrusted data; extraction cannot approve claims, send messages, or change records; outputs schema-validated. |

## Explicit non-claims

- No compliance certification (SOC 2, ISO, DPDP, GDPR) has been performed.
- No penetration test has been performed.
- Rate limiting, file scanning, and backups/restore are planned, not yet implemented.

## Next steps

- Add rate limiting (auth, uploads, AI) and invitation token single-use enforcement tests.
- Add tenant-isolation integration tests as data-bearing modules arrive.
- Add file handling and AI injection tests in Phase 3.
