# Herald

Herald is a tool that automatically generates changelogs for your latest version (from `package.json`) using commit messages and AI. The generated changelog is posted to a Microsoft Teams channel using a webhook.

Currently supports Ollama models for AI-powered changelog generation.

## Installation

Install Herald as a dev dependency:

```bash
pnpm install -D herald-changelog
```

## Configuration

### 1. Environment Variables

Add the following variables to your `.env` file:

```env
# GitLab personal access token with repository read access
HERALD_GITLAB_TOKEN=your_personal_access_token

# GitLab project ID (numeric)
HERALD_GITLAB_PROJECT_ID=your_project_id

# GitLab base URL for your instance (default: https://gitlab.com/api/v4)
HERALD_GITLAB_BASE_URL=https://gitlab.com/api/v4

# Microsoft Teams webhook connector URL
HERALD_TEAMS_WEBHOOK_URL=https://your-teams-webhook-url

# Locally running Ollama model name (e.g., gemma3:1b, llama3, etc.)
AI_MODEL=gemma3:1b
```

### 2. Add to Scripts

Add Herald to your `package.json` scripts:

```json
{
  "scripts": {
    "announce": "herald-changelog"
  }
}
```

## Usage

1. **Ensure Ollama is running**

   Make sure your Ollama service is running locally. Visit [ollama.com](https://ollama.com/) for installation and setup instructions.

2. **Run the script**

   ```bash
   pnpm run announce
   ```

## How It Works

1. Herald reads the version from your `package.json`
2. Fetches commits between the current version and the previous version from GitLab
3. Uses AI (via Ollama) to generate a clean, formatted changelog from commit messages
4. Posts the changelog as a formatted message card to your Microsoft Teams channel

## Requirements

- Node.js 18+ or Bun
- Ollama installed and running locally
- GitLab repository with semantic version tags (format: `v1.2.3`)
- Microsoft Teams webhook URL
