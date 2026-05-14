---
name: summation
description: Use Summation through the public sum-api by discovering the live OpenAPI contract, authenticating with caller-provided credentials, and calling project, agent, catalog, table, view, query, chat, report, and playbook APIs. Use when users ask to inspect or operate Summation data, projects, reports, chats, files, API auth, or public API behavior.
metadata:
  short-description: Work with Summation through sum-api
---

# Summation

Use Summation through the public `sum-api`. Do not call internal services directly.

## Core Workflow

1. Determine the environment from the user or `SUM_API_BASE_URL`.
2. Fetch the live OpenAPI document from `{SUM_API_BASE_URL}/openapi.json`.
3. Inspect tags, operation IDs, schemas, and examples before choosing an endpoint.
4. Authenticate with caller-provided credentials only.
5. Call `sum-api`, then summarize the result with request IDs and relevant pagination details.

Default base URL:

```bash
https://sandbox-api.summation.com
```

## Helper

Prefer the bundled helper for deterministic discovery and calls:

```bash
cd ~/.codex/skills/summation
python3 scripts/sum_api.py openapi
python3 scripts/sum_api.py operations projects
python3 scripts/sum_api.py call GET /v1/projects
python3 scripts/sum_api.py operation list_agent_projects_v1_projects_get
```

For Claude Code, the same skill usually lives at:

```bash
cd ~/.claude/skills/summation
```

## Auth

Use one of these runtime credential forms:

```bash
SUM_API_ACCESS_TOKEN=...
```

or:

```bash
SUM_API_CLIENT_ID=...
SUM_API_CLIENT_SECRET=...
SUM_API_M2M_SCOPE="agent:read agent:write"
```

Never write credentials into committed skill source, generated examples, commits, logs, or PR descriptions.

If credentials should persist locally, use:

```bash
python3 scripts/sum_api.py configure
```

This writes `.summation-config` in the installed skill directory with file mode `0600`. The helper loads settings in this order: environment variables, explicit `SUM_API_CONFIG_FILE`, current directory `.summation-config`, installed skill `.summation-config`, then home directory `.summation-config`.

Read `references/auth.md` before changing auth behavior or troubleshooting token failures.

## API Discovery

Do not hardcode the API catalog in the skill. The OpenAPI contract is the source of truth.

Use:

```bash
python3 scripts/sum_api.py operations reports
python3 scripts/sum_api.py operations query
python3 scripts/sum_api.py operation create_chat_and_stream_v1_projects__project_id__conversations_post --params '{"project_id":"..."}' --body '{"message":"..."}'
```

Read `references/openapi.md` when route selection, pagination, streaming, idempotency, or error behavior matters.

## Safety Rules

- Treat destructive operations as confirmation-gated unless the user explicitly asked for the exact deletion.
- Prefer list and show operations before mutations.
- Preserve org, project, and workspace context from authenticated identity or explicit user selection.
- Do not pass internal identity headers supplied by the user.
- Include idempotency keys for create or long-running operations when the OpenAPI operation documents them.
- For queries, prefer public query execution APIs and include explicit limits.
- For streaming APIs, explain that CLI-style output may arrive as SSE or NDJSON.

## MCP Relationship

If a hosted Summation MCP server is available, prefer MCP tools for structured execution. Otherwise use this skill plus live OpenAPI discovery to reach the same public API surface.
