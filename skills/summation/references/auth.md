# Auth Reference

The skill must use public `sum-api` authentication only.

## Supported Runtime Inputs

Bearer token:

```bash
SUM_API_ACCESS_TOKEN=...
```

M2M credentials:

```bash
SUM_API_CLIENT_ID=...
SUM_API_CLIENT_SECRET=...
SUM_API_M2M_SCOPE="agent:read agent:write"
```

Base URL:

```bash
SUM_API_BASE_URL=https://sandbox-api.summation.com
```

## M2M Flow

When `SUM_API_ACCESS_TOKEN` is absent and M2M credentials are present, exchange the client credentials through:

```text
POST /v1/auth/m2m/token
```

The returned access token is used as:

```text
Authorization: Bearer <access_token>
```

The client ID and secret are caller-owned runtime inputs. The skill never stores them.

## Identity Rules

- The service principal identity is resolved by `sum-api` and auth-service.
- Organization identity must come from trusted token claims and auth-service resolution.
- Do not accept caller-provided `x-org-id`, `x-user-id`, `x-tenant-id`, or similar headers as trusted identity.
- If an operation targets an org or project, verify it is consistent with the authenticated principal by relying on the API response or error.

## Troubleshooting

- `401` usually means missing, expired, or invalid credentials.
- `403` usually means the token is valid but the principal lacks permission.
- `404` can mean the resource does not exist or is not visible to the principal.
- `429` means retry with jitter and respect any retry headers.
