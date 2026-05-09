---
name: herald-setup
description: >-
  Set up herald-ai (AI-powered changelog generator and release announcer) in a project.
  Use when the user wants to: (1) add herald-ai to their project, (2) configure herald-ai,
  (3) set up release announcements or changelog generation, (4) integrate herald-ai with
  Teams, GitHub Releases, GitLab Releases, Telegram, Element/Matrix, or Slack.
  TRIGGER when: user says "set up herald", "add herald-ai", "configure release announcements",
  "setup changelog generator", or mentions herald-ai setup/init/config.
---

# Herald-AI Setup

## Interactive Setup Flow

Ask the user these questions **one group at a time**:

### Step 1: Config format

Ask: "Do you prefer **TypeScript** (`herald.config.ts`) or **JSON** (`herald.config.json`)?"

- TypeScript: type safety via `defineConfig()`, direct `process.env` access
- JSON: env var interpolation with `$VAR` or `${VAR}` syntax

### Step 2: Providers

Ask which providers to enable:

| Provider | Description |
|----------|-------------|
| **Teams** | Post to Microsoft Teams channels |
| **GitHub Release** | Create GitHub Release pages |
| **GitLab Release** | Create GitLab Release pages |
| **Telegram** | Send via Telegram bot |
| **Element** | Post to Matrix/Element rooms |
| **Slack** | Post via Slack incoming webhook |

User may select one or more.

### Step 3: AI provider

Ask: "Which AI model? Herald uses any OpenAI-compatible API (default: OpenRouter at `https://openrouter.ai/api/v1`)."

Common choices:
- OpenRouter: model like `openai/gpt-4o-mini`, key var `OPEN_ROUTER_API_KEY`
- Direct OpenAI: base URL `https://api.openai.com/v1`, key var `OPENAI_API_KEY`

The API key **must** be set in `.env` or `.env.local` — never hardcoded in the config file.

### Step 4: Install and generate

1. **Detect package manager** by checking which lockfile exists in the project root:
   - `bun.lock` or `bun.lockb` -> `bun`
   - `pnpm-lock.yaml` -> `pnpm`
   - `yarn.lock` -> `yarn`
   - `package-lock.json` -> `npm`
   - If none found, ask the user which package manager they use
2. Install using the detected package manager:
   - bun: `bun add -D herald-ai`
   - pnpm: `pnpm add -D herald-ai`
   - yarn: `yarn add -D herald-ai`
   - npm: `npm install -D herald-ai`
3. Create config file per user choices
4. List required env vars — if `.env` or `.env.local` already exists, append missing vars; otherwise create one
5. Suggest adding scripts to `package.json`

## Config Templates

### TypeScript (`herald.config.ts`)

The AI API key is read from `.env` via `process.env` — never hardcode it.

```typescript
import { defineConfig } from "herald-ai";

export default defineConfig({
  ai: {
    model: "<model>",
    apiKey: process.env.<AI_KEY_VAR>!,
    baseUrl: "<baseUrl>", // omit for OpenRouter default
  },
  providers: [
    // ... selected providers
  ],
});
```

### JSON (`herald.config.json`)

In JSON configs, reference the env var using `$VAR` or `${VAR}` syntax — herald resolves these from `.env` at runtime via `dotenv-flow`.

```json
{
  "ai": {
    "model": "<model>",
    "apiKey": "${AI_KEY_VAR}",
    "baseUrl": "<baseUrl>"
  },
  "providers": []
}
```

## Provider Configuration

### Teams

Config fields:
- `type`: `"teams"`
- `webhookUrl`: Microsoft Teams incoming webhook URL

Env var: `TEAMS_WEBHOOK_URL`

TS: `{ type: "teams", webhookUrl: process.env.TEAMS_WEBHOOK_URL! }`
JSON: `{ "type": "teams", "webhookUrl": "$TEAMS_WEBHOOK_URL" }`

Setup: In Teams, go to the channel > Manage channel > Connectors > Add "Incoming Webhook".

### GitHub Release

Config fields:
- `type`: `"github-release"`
- `token`: GitHub PAT (needs `contents: write`)
- `owner`: Repository owner
- `repo`: Repository name

Env var: `GITHUB_TOKEN`

TS:
```typescript
{
  type: "github-release",
  token: process.env.GITHUB_TOKEN!,
  owner: "my-org",
  repo: "my-repo",
}
```

JSON:
```json
{
  "type": "github-release",
  "token": "$GITHUB_TOKEN",
  "owner": "my-org",
  "repo": "my-repo"
}
```

In GitHub Actions: `${{ secrets.GITHUB_TOKEN }}` is auto-provided.

### GitLab Release

Config fields:
- `type`: `"gitlab-release"`
- `baseUrl`: GitLab API URL (e.g., `https://gitlab.com/api/v4`)
- `token`: GitLab PAT (needs `api` scope)
- `projectId`: GitLab project ID (numeric string)

Env var: `GITLAB_TOKEN`

TS:
```typescript
{
  type: "gitlab-release",
  baseUrl: "https://gitlab.com/api/v4",
  token: process.env.GITLAB_TOKEN!,
  projectId: "12345",
}
```

JSON:
```json
{
  "type": "gitlab-release",
  "baseUrl": "https://gitlab.com/api/v4",
  "token": "$GITLAB_TOKEN",
  "projectId": "12345"
}
```

In GitLab CI: Use `$CI_JOB_TOKEN` or a project access token.

### Telegram

Config fields:
- `type`: `"telegram"`
- `botToken`: Bot token from @BotFather
- `chatId`: Target chat/group/channel ID

Env vars: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

TS:
```typescript
{
  type: "telegram",
  botToken: process.env.TELEGRAM_BOT_TOKEN!,
  chatId: process.env.TELEGRAM_CHAT_ID!,
}
```

JSON:
```json
{
  "type": "telegram",
  "botToken": "$TELEGRAM_BOT_TOKEN",
  "chatId": "$TELEGRAM_CHAT_ID"
}
```

### Slack

Config fields:
- `type`: `"slack"`
- `webhookUrl`: Slack incoming webhook URL

Env var: `SLACK_WEBHOOK_URL`

TS: `{ type: "slack", webhookUrl: process.env.SLACK_WEBHOOK_URL! }`
JSON: `{ "type": "slack", "webhookUrl": "$SLACK_WEBHOOK_URL" }`

Setup: In Slack, create an app at https://api.slack.com/apps, enable "Incoming Webhooks", add a new webhook to a workspace channel, and copy the URL.

### Element (Matrix)

Config fields:
- `type`: `"element"`
- `homeserverUrl`: Matrix homeserver URL
- `accessToken`: Matrix access token
- `roomId`: Target room ID (e.g., `!abc123:matrix.org`)

Env var: `ELEMENT_ACCESS_TOKEN`

TS:
```typescript
{
  type: "element",
  homeserverUrl: "https://matrix.org",
  accessToken: process.env.ELEMENT_ACCESS_TOKEN!,
  roomId: "!roomid:matrix.org",
}
```

JSON:
```json
{
  "type": "element",
  "homeserverUrl": "https://matrix.org",
  "accessToken": "$ELEMENT_ACCESS_TOKEN",
  "roomId": "!roomid:matrix.org"
}
```

## Environment Variables

After generating the config, check if `.env` or `.env.local` already exists in the project. If it does, append only the missing variables. If neither exists, create `.env.local`. Always verify `.gitignore` covers `.env*` files before writing.

Example variables to add:
```bash
# AI Provider (required)
OPEN_ROUTER_API_KEY=your-api-key-here

# Provider: GitHub Release
GITHUB_TOKEN=your-github-token-here
```

**Always required:**
- AI API key (variable name from step 3)

**Per provider:**
- **Teams**: `TEAMS_WEBHOOK_URL`
- **GitHub Release**: `GITHUB_TOKEN`
- **GitLab Release**: `GITLAB_TOKEN`
- **Telegram**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- **Element**: `ELEMENT_ACCESS_TOKEN`
- **Slack**: `SLACK_WEBHOOK_URL`

Herald uses `dotenv-flow` so `.env`, `.env.local`, `.env.production`, etc. all work.

## Package.json Scripts

Suggest adding:
```json
{
  "scripts": {
    "announce": "herald-ai",
    "changelog": "herald-ai --debug"
  }
}
```

`--debug` generates changelog without sending announcements (preview mode).

## Optional Config Fields

- `projectName`: Override project name (defaults to `package.json` name)
