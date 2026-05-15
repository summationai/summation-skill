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

Local config file:

```text
.summation-config
```

The file uses environment-style lines:

```bash
SUM_API_BASE_URL=https://sandbox-api.summation.com
SUM_API_CLIENT_ID=...
SUM_API_CLIENT_SECRET=...
SUM_API_M2M_SCOPE="agent:read agent:write"
```

The helper reads settings in this order:

1. Environment variables.
2. `SUM_API_CONFIG_FILE`.
3. Current directory `.summation-config`.
4. Installed skill directory `.summation-config`.
5. Home directory `.summation-config`.

Use file mode `0600` for files that contain secrets.

## M2M Flow

When `SUM_API_ACCESS_TOKEN` is absent and M2M credentials are present, exchange the client credentials through:

```text
POST /v1/auth/m2m/token
```

The token exchange is sent as `application/x-www-form-urlencoded`, not JSON. Normal sum-api calls still use JSON bodies.

The returned access token is used as:

```text
Authorization: Bearer <access_token>
```

The client ID and secret are caller-owned inputs. The skill can read them from the local config file, but the installer never writes secrets and the repo ignores `.summation-config`.

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
- On macOS, `certificate verify failed` usually means Python cannot find a CA bundle. Set `SSL_CERT_FILE` to a CA bundle path or install `certifi` in the Python environment running the skill helper.
