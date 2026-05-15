# Summation Skill

Installable agent skill for working with Summation through the public `sum-api`.

The skill does not carry a copied API catalog. It fetches the live OpenAPI contract from the selected Summation environment and uses caller-provided credentials at runtime.

## Install

From GitHub:

```bash
npx github:summationai/summation-skill install all
```

Targets:

```bash
npx github:summationai/summation-skill install codex
npx github:summationai/summation-skill install claude
npx github:summationai/summation-skill install all
```

Default install locations:

```text
~/.codex/skills/summation
~/.claude/skills/summation
```

The default Codex and Claude installs are symlinks to:

```text
~/.agents/skills/summation
```

Re-running the installer refreshes the shared skill directory and keeps any local `.summation-config` file.

## Runtime Environment

Set the target API:

```bash
export SUM_API_BASE_URL=https://sandbox-api.summation.com
```

M2M credentials:

```bash
export SUM_API_CLIENT_ID=...
export SUM_API_CLIENT_SECRET=...
```

On macOS, if Python cannot verify TLS certificates, either install `certifi` in the Python environment running the helper or set:

```bash
export SSL_CERT_FILE="$(python3 -m certifi)"
```

Credentials are not written by the installer and must not be committed to the repo.

You can also create a local skill config file:

```bash
python3 ~/.codex/skills/summation/scripts/sum_api.py configure \
  --base-url https://sandbox-api.summation.com \
  --client-id ... \
  --client-secret ...
```

The helper writes `~/.codex/skills/summation/.summation-config` with file mode `0600`. Reinstalling the skill preserves that local file. Environment variables still take priority.

## Local Check

```bash
node bin/summation-skill.js doctor
node bin/summation-skill.js install all
python3 skills/summation/scripts/sum_api.py operations projects
```
