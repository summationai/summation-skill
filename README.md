# Summation Skill

Installable agent skill for working with Summation through the public `sum-api`.

The skill does not carry a copied API catalog. It fetches the live OpenAPI contract from the selected Summation environment and uses caller-provided credentials at runtime.

## Install

From GitHub:

```bash
npx github:summationai/summation-skill install all
```

After publishing to npm:

```bash
npx @summation/summation-skill install all
```

Targets:

```bash
npx @summation/summation-skill install codex
npx @summation/summation-skill install claude
npx @summation/summation-skill install all
```

Default install locations:

```text
~/.codex/skills/summation
~/.claude/skills/summation
```

## Runtime Environment

Set the target API:

```bash
export SUM_API_BASE_URL=https://sandbox-api.summation.com
```

Use an existing bearer token:

```bash
export SUM_API_ACCESS_TOKEN=...
```

Or use M2M credentials:

```bash
export SUM_API_CLIENT_ID=...
export SUM_API_CLIENT_SECRET=...
```

Credentials are not written by the installer or stored in the skill.

## Local Check

```bash
node bin/summation-skill.js doctor
node bin/summation-skill.js install all
python3 skills/summation/scripts/sum_api.py operations projects
```
