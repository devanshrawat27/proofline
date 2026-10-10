# API contracts

Base path: `/api/v1`. Health endpoints are unprefixed.

All responses use a consistent error shape:

```json
{ "statusCode": 403, "code": "FORBIDDEN", "message": "…", "details": null, "requestId": "…" }
```

Errors never include stack traces or provider internals.

## Implemented (Phase 1)

### Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | public | Liveness: `{ status: "ok", uptime }` |
| GET | `/ready` | public | Readiness: checks DB, `{ status: "ready" }` or 503 |

### Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/signup` | public | Creates user + organization (owner). Sets session cookie. |
| POST | `/api/v1/auth/login` | public | Sets session cookie. |
| POST | `/api/v1/auth/logout` | session | Revokes session, clears cookie. `204`. |
| GET | `/api/v1/auth/me` | session | `{ user, organization, membership }`. |

### Organizations

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/api/v1/organization` | `org:read` |
| PATCH | `/api/v1/organization` | `org:update` |

### Members

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/api/v1/members` | `member:read` |
| GET | `/api/v1/members/invitations` | `member:read` |
| POST | `/api/v1/members/invitations` | `member:invite` |
| POST | `/api/v1/members/invitations/accept` | public | Accepts a token; creates/links a user and session. |

Request/response bodies are defined by Zod schemas in
[`packages/shared-types`](../packages/shared-types/src) and reused by the frontend.

## Planned (later phases)

Suppliers, purchase-orders (`/issue`, `/cancel`, `/receipts`), receipts
(`/submit`, `/amendments`), documents (upload, process, review), matches
(confirm/reject), discrepancies, cases (assign, transitions, messages,
resolutions, close), resolutions (approve, verify), supplier portal, dashboard
summary, reports, audit events, notifications. These are design targets only —
they will be added with implementation and tests together.
