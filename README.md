
<img width="1472" height="704" alt="Gemini_Generated_Image_kca972kca972kca9" src="https://github.com/user-attachments/assets/a6a42f2e-01e1-4f5e-ba7c-c098aa4fec0a" />

Herald is a tool that automatically generates changelogs for your latest version (from `package.json`) using commit messages and AI. The generated changelog is posted to a Microsoft Teams channel using a webhook.

Supports any OpenAI-compatible AI platform (defaults to OpenRouter, but can be configured to use other platforms like Liara via the `AI_BASE_URL` environment variable).

## Installation

Install Herald as a dev dependency:

```bash
pnpm install -D herald-ai
```

## Configuration

### 1. Environment Variables

Add the following variables to your `.env` file:

```env
# GitLab personal access token with repository read access
GITLAB_TOKEN=your_personal_access_token

# GitLab project ID (numeric)
GITLAB_PROJECT_ID=your_project_id

# GitLab base URL for your instance (default: https://gitlab.com/api/v4)
GITLAB_BASE_URL=https://gitlab.com/api/v4

# Microsoft Teams webhook connector URL
TEAMS_WEBHOOK_URL=https://your-teams-webhook-url

# OpenRouter model name (e.g., openai/gpt-4o-mini, anthropic/claude-3-opus)
AI_MODEL=openai/gpt-4o-mini

# OpenRouter API key
AI_API_KEY=<api-key-here>

# AI base URL (optional, defaults to OpenRouter)
# Can be used with any OpenAI-compatible platform (e.g., Liara)
# AI_BASE_URL=https://openrouter.ai/api/**v1**
```

### 2. Add to Scripts

Add Herald to your `package.json` scripts:

```json
{
  "scripts": {
    "announce": "herald-ai"
  }
}
```

## Usage

1. **Run the script**

   ```bash
   # Use version from package.json
   pnpm exec herald-ai
   # or with npx
   npx herald-ai
   # or with bunx
   bunx herald-ai

   # Or specify a specific tag
   pnpm exec herald-ai --tag v1.2.3
   # or
   npx herald-ai --tag v1.2.3
   # or
   bunx herald-ai --tag 1.2.3
   ```

   Alternatively, you can use the npm script (requires extra `--`):

   ```bash
   pnpm run announce
   # or with tag
   pnpm run announce -- --tag v1.2.3
   ```

## How It Works

1. Herald reads the version from your `package.json` (or uses the provided `--tag` option)
2. Fetches commits between the current version and the previous version from GitLab
3. Uses AI to generate a clean, formatted changelog from commit messages
4. Posts the changelog as a formatted message card to your Microsoft Teams channel

## Command Line Options

- `--tag <version>`: Specify a Git tag to announce (e.g., `--tag v1.2.3` or `--tag 1.2.3`). If not provided, Herald will use the version from `package.json`.

## Requirements

- Node.js 18+ or Bun
- AI API key (OpenRouter API key by default, or compatible with any OpenAI-compatible platform)
- GitLab repository with semantic version tags (format: `v1.2.3`)
- Microsoft Teams webhook URL
