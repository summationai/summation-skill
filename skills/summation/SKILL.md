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

Prefer the bundled helper for deterministic discovery and calls. The skill lives at `~/.claude/skills/summation` (Claude Code) or `~/.codex/skills/summation` (Codex).

```bash
SKILL=~/.claude/skills/summation     # or ~/.codex/skills/summation
python3 $SKILL/scripts/sum_api.py openapi
python3 $SKILL/scripts/sum_api.py operations projects
python3 $SKILL/scripts/sum_api.py describe create_project_v1_projects_post
python3 $SKILL/scripts/sum_api.py schema FileWriteRequest
python3 $SKILL/scripts/sum_api.py call GET /v1/projects
python3 $SKILL/scripts/sum_api.py operation list_agent_projects_v1_projects_get
```

### Subcommands

- `openapi` — full OpenAPI document.
- `operations [search]` — list operations; filter by method, path, tag, operationId, or summary.
- `describe <operationId>` — print one operation's resolved schema (parameters, request body, responses) **without calling it**. Use this before mutating endpoints.
- `schema <Name>` — print a component schema with `$ref`s resolved. Substring match if no exact hit (errors if ambiguous).
- `call <METHOD> <path>` — call any path directly. Flags: `--query`, `--body`, `--stream`.
- `operation <operationId>` — call a discovered operation. Flags: `--params`, `--body`, `--stream`.
- `token` — print a fresh M2M access token (for piping into `curl`).
- `configure` — write a local `.summation-config` (mode `0600`).
- `doctor` — sanity check (base URL, config file, OpenAPI reachability, auth inputs).

### Streaming (SSE)

For streaming endpoints (chat create/reply, report generation, report verification, file imports), pass `--stream`. The helper sets `Accept: text/event-stream` and writes one response line at a time to stdout. In Claude Code, pair with `Monitor` so each SSE line becomes an event:

```bash
python3 $SKILL/scripts/sum_api.py call --stream \
  POST /v1/projects/<project_id>/conversations \
  --body '{"message":"..."}'
```

## Auth

Ask the user to drop the `.summation-config` that you can copy over to the $SKILL folder or ask user to point to a file that contains `SUM_API_BASE_URL`, `SUM_API_CLIENT_ID` and `SUM_API_CLIENT_SECRET`

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
python3 $SKILL/scripts/sum_api.py operations reports
python3 $SKILL/scripts/sum_api.py operations query
python3 $SKILL/scripts/sum_api.py describe create_chat_and_stream_v1_projects__project_id__conversations_post
python3 $SKILL/scripts/sum_api.py operation create_chat_and_stream_v1_projects__project_id__conversations_post \
  --params '{"project_id":"..."}' --body '{"message":"..."}' --stream
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
