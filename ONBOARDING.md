# Summation Skill — Onboarding

| Note: Paste this guide into Claude Code or Codex. Agent will walk you through your team's setup for Summation and get you started.

Plug Summation into your existing **Claude Code** or **Codex** harness. The skill talks to the public `sum-api`, discovers the live OpenAPI contract at runtime, and ships with M2M auth out of the box.

## What you need

- **Your harness** — Claude Code or Codex, already installed and working.
- **Your `.summation-config` file** — shared with you separately. Contains your production M2M credentials and base URL. Treat it like a secret. Do not commit it.

## Setup (one time)

### 1. Install the skill

The skill repo is public — no GitHub auth needed. Pick the target that matches your harness, or install both:

```bash
npx github:summationai/summation-skill install claude   # Claude Code
npx github:summationai/summation-skill install codex    # Codex
npx github:summationai/summation-skill install all      # both
```

Install locations (both symlink to `~/.agents/skills/summation`):

- Claude Code → `~/.claude/skills/summation`
- Codex → `~/.codex/skills/summation`

### 2. Drop in your credentials

Move the `.summation-config` we sent you into the skill directory:

```bash
# Claude Code
mv ~/Downloads/.summation-config ~/.claude/skills/summation/.summation-config

# Codex
mv ~/Downloads/.summation-config ~/.codex/skills/summation/.summation-config
```

Either location works for either harness (they share the symlinked target). Permissions are already `0600`; if not, `chmod 600` it.

### 3. Verify

```bash
# pick whichever you installed
python3 ~/.claude/skills/summation/scripts/sum_api.py doctor
python3 ~/.codex/skills/summation/scripts/sum_api.py doctor
```

Expect your production base URL and `has_m2m_credentials: true`. If anything looks off, stop and ping us.

## Using it

Open your harness in any directory and just talk. The skill auto-loads when your request matches Summation work. Examples:

- "List my Summation projects"
- "Create a project called Q3 Review and upload `./forecast.csv` to it"
- "Open a chat in <project> and ask Addison to build a report on revenue trends"
- "Stream Addison's reply back here as it runs"

Streaming endpoints (chats, report generation, file imports) emit events live, so you see Addison's tool calls and message deltas in real time.

## Security

- `.summation-config` is local, mode `0600`. Not committed anywhere.
- M2M credentials act as a service account in your org — actions are attributed to that account in audit logs.
- To rotate: replace the file and re-run `doctor`. To revoke: ask us to deactivate the client ID.

## Support

- Skill source / issues: https://github.com/summationai/summation-skill
- Anything else: your Summation contact.
