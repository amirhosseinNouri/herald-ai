
<img width="1472" height="704" alt="Gemini_Generated_Image_kca972kca972kca9" src="https://github.com/user-attachments/assets/a6a42f2e-01e1-4f5e-ba7c-c098aa4fec0a" />

Herald is a CLI tool that generates AI-powered changelogs from your git commit history and announces releases to multiple platforms. It diffs commits between HEAD and a selected tag, sends them to an LLM, and posts the result to your configured providers.

Supports any OpenAI-compatible AI platform (defaults to OpenRouter).

## Installation

Install Herald as a dev dependency:

```bash
pnpm install -D herald-ai
```

### Agent-Assisted Setup

Herald ships with a [`herald-setup`](./skills/herald-setup/SKILL.md) skill that works with any agent supporting the [skills](https://github.com/amirhosseinNouri/skills) spec (Claude Code, Cursor, etc.). It walks you through choosing a config format, selecting providers, and generating the config and env vars for your project.

Add the skill using your package manager of choice:

```bash
# npm
npx skills add amirhosseinNouri/herald-ai

# bun
bunx skills add amirhosseinNouri/herald-ai

# pnpm
pnpm dlx skills add amirhosseinNouri/herald-ai

# yarn
yarn dlx skills add amirhosseinNouri/herald-ai
```

Then ask your agent to "set up herald-ai".

## Configuration

Create a `herald.config.ts` (or `.js`, `.mjs`, `.json`) file in your project root:

```ts
import { defineConfig } from "herald-ai";

export default defineConfig({
  ai: {
    model: "openai/gpt-4o-mini",
    apiKey: process.env.AI_API_KEY!,
  },
  providers: [
    { type: "teams", webhookUrl: process.env.TEAMS_WEBHOOK_URL! },
  ],
});
```

### JSON Config

You can also use a `herald.config.json` file. Environment variable references (`$VAR` or `${VAR}`) are automatically interpolated:

```json
{
  "ai": {
    "model": "openai/gpt-4o-mini",
    "apiKey": "$AI_API_KEY"
  },
  "providers": [
    { "type": "teams", "webhookUrl": "${TEAMS_WEBHOOK_URL}" }
  ]
}
```

### Environment Variables

Herald uses [dotenv-flow](https://github.com/kerimdzhanov/dotenv-flow) to automatically load environment variables from `.env` files. The following files are loaded in order (variables defined in earlier files take precedence):

- `.env`
- `.env.local`
- `.env.[NODE_ENV]` (e.g. `.env.development`, `.env.production`)
- `.env.[NODE_ENV].local` (e.g. `.env.development.local`)

This works for both TS/JS configs (via `process.env`) and JSON configs (via `$VAR` / `${VAR}` interpolation). Existing environment variables (e.g. from CI) are never overridden.

> **Tip:** Add `.env*.local` to your `.gitignore` to keep local secrets out of version control.

### Full Config Example

```ts
import { defineConfig } from "herald-ai";

export default defineConfig({
  ai: {
    model: "openai/gpt-4o-mini",
    apiKey: process.env.AI_API_KEY!,
    baseUrl: "https://openrouter.ai/api/v1", // optional, defaults to OpenRouter
  },
  providers: [
    // Microsoft Teams
    {
      type: "teams",
      webhookUrl: process.env.TEAMS_WEBHOOK_URL!,
    },
    // GitLab Release Page
    {
      type: "gitlab-release",
      baseUrl: "https://gitlab.example.com/api/v4",
      token: process.env.GITLAB_TOKEN!,
      projectId: "5755",
    },
    // Telegram
    {
      type: "telegram",
      botToken: process.env.TELEGRAM_BOT_TOKEN!,
      chatId: process.env.TELEGRAM_CHAT_ID!,
    },
    // Element (Matrix)
    {
      type: "element",
      homeserverUrl: "https://matrix.example.com",
      accessToken: process.env.ELEMENT_ACCESS_TOKEN!,
      roomId: "!roomid:example.com",
    },
  ],
  // Optional: custom AI prompt template for changelog generation
  template: `Generate a changelog from the following commits. Output a clean bullet list.`,
  // Optional: override project name (defaults to package.json name)
  projectName: "My App",
  // Optional: override release manager (defaults to git config user.name)
  releaseManager: "Jane Doe",
  // Optional: debug mode - only prints changelog, no announcements
  debug: false,
});
```

### Debug-Only Config

To only generate and preview the changelog without sending announcements:

```ts
import { defineConfig } from "herald-ai";

export default defineConfig({
  ai: {
    model: "openai/gpt-4o-mini",
    apiKey: process.env.AI_API_KEY!,
  },
  providers: [
    { type: "teams", webhookUrl: "https://placeholder" },
  ],
  debug: true,
});
```

## Usage

```bash
# Interactive mode: select a tag from a list
herald-ai

# Specify a tag directly
herald-ai --from v1.2.0

# Debug mode: generate changelog without sending announcements
herald-ai --debug

# Custom config path
herald-ai --config ./config/herald.config.ts
```

### Add to Scripts

```json
{
  "scripts": {
    "announce": "herald-ai",
    "changelog": "herald-ai --debug"
  }
}
```

## How It Works

1. Herald loads your configuration (`herald.config.ts`, `.js`, `.mjs`, or `.json`)
2. Fetches all semver tags from your local git repository
3. You select a tag (interactively, via `--from`, or auto-selected in CI environments)
4. Gets all commits between the selected tag and HEAD
5. Sends commits to the configured AI model to generate a changelog
6. Posts the changelog to all configured providers (or prints it in debug mode)

## Command Line Options

| Flag | Description |
|------|-------------|
| `--config <path>` | Path to config file (default: auto-discover `herald.config.{ts,js,mjs,json}`) |
| `--from <tag>` | Specify a tag to diff against HEAD |
| `--debug` | Generate changelog and print it without sending announcements |

> **Note:** Herald automatically detects CI environments (GitHub Actions, GitLab CI) and runs in non-interactive mode, auto-selecting the latest semver tag.

## Providers

| Provider | Description | Required Config |
|----------|-------------|-----------------|
| `teams` | Microsoft Teams webhook | `webhookUrl` |
| `gitlab-release` | GitLab Release page | `baseUrl`, `token`, `projectId` |
| `telegram` | Telegram bot message | `botToken`, `chatId` |
| `element` | Element/Matrix room message | `homeserverUrl`, `accessToken`, `roomId` |

## Requirements

- Node.js 18+ or Bun
- AI API key (OpenRouter by default, or any OpenAI-compatible platform)
- Git repository with semver tags (e.g., `v1.2.3`)
