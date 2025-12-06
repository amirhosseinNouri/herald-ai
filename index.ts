#!/usr/bin/env node

import { ollama } from 'ollama-ai-provider-v2';
import { generateText } from 'ai';
import fs from 'fs';

/**
 * Teams Release Announcement Script
 *
 * Usage:
 *   ts-node announce-release.ts <project-name> <tag>
 *
 * Example:
 *   ts-node announce-release.ts "My Project" "v1.2.3"
 */

const TEAMS_WEBHOOK_URL =
  'https://snappcab.webhook.office.com/webhookb2/81f23a9c-534c-4176-9154-550ad9c6d4aa@17d2e12c-c498-4570-85de-a88e58c5bb02/IncomingWebhook/9e93fc76012344888946a5609a148c80/e363d61e-54b9-4391-8652-d3caaa25b948/V21OurqM6nDARjzyRcESXWQUZqeWxCHXIqpZANif3mK5Q1';

const GITLAB_API_URL = 'https://gitlab.snapp.ir/api/v4';

interface TeamsMessageCard {
  '@type': string;
  '@context': string;
  themeColor: string;
  summary: string;
  sections: Array<{
    activityTitle: string;
    activitySubtitle?: string;
    activityImage?: string;
    facts: Array<{
      name: string;
      value: string;
    }>;
    markdown: boolean;
  }>;
}

type Commit = {
  id: string;
  short_id: string;
  created_at: string;
  parent_ids: string[];
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committer_name: string;
  committer_email: string;
  committed_date: string;
  web_url: string;
};

type GitlabTag = {
  name: string;
  message: string;
  target: string;
  commit: Commit;
  release: null;
  protected: false;
  created_at: string;
};

type GitlabUer = {
  name: string;
};

const parseConfig = () => {
    const config = fs.readFileSync('.release-.json', 'utf8');
}

const fetchVersionCommits = async (version: string) => {
  const tags = await fetch(
    `${GITLAB_API_URL}/projects/${process.env.GITLAB_PROJECT_ID}/repository/tags`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITLAB_TOKEN}`,
      },
    },
  );
  const tagsData = (await tags.json()) as GitlabTag[];
  const semanticTags = tagsData.filter((tag: any) =>
    tag.name.match(/^v\d+\.\d+\.\d+$/),
  );

  const tagIndex = semanticTags.findIndex(
    (tag: GitlabTag) => tag.name === version,
  );
  const previousTag = semanticTags[tagIndex + 1];

  if (!previousTag) {
    throw new Error('Previous tag not found');
  }

  // Fetch all commits between the version and the previous version
  const commits = await fetch(
    `${GITLAB_API_URL}/projects/${process.env.GITLAB_PROJECT_ID}/repository/compare?from=${previousTag.name}&to=${version}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITLAB_TOKEN}`,
      },
    },
  );

  const data = (await commits.json()) as { commits: Commit[] };

  const commitsWithoutTags = data.commits.filter(
    (commit: Commit) => !commit.title.match(/^\d+\.\d+\.\d+(-\S+)?$/),
  );

  return commitsWithoutTags;
};

const generateChangelog = async (commits: Commit[]) => {
  const data = await generateText({
    model: ollama('gemma3:1b'),
    prompt: `Create a changelog for the following commits: ${commits.map(
      (commit: Commit) => commit.message,
    )}`,
    system: `You are an AI agent responsible for generating a changelog from a list of commit messages. Your output must be a simple, clean list with no title, headers, or explanatory text. Each item should summarize the commit clearly and concisely. Improve unclear or low-quality commit messages while keeping the intended meaning. Avoid redundancy and group similar changes when appropriate. Maintain a neutral, professional tone.`,
  });

  return data.text;
};

const extractReleaseManager = async () => {
  const response = await fetch(`${GITLAB_API_URL}/user`, {
    headers: {
      Authorization: `Bearer ${process.env.GITLAB_TOKEN}`,
    },
  });

  const user = (await response.json()) as GitlabUer;
  return user.name;
};

const generateMessageCard = (
  projectName: string,
  tag: string,
  changelog: string,
  releaseManager: string,
) => {
  const timestamp = new Date().toLocaleString();

  const messageCard: TeamsMessageCard = {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    themeColor: '0078D7',
    summary: `${projectName} ${tag} Released`,
    sections: [
      {
        activityTitle: `🚀 ${projectName} version ${tag} is now on production!`,
        facts: [
          {
            name: 'Project',
            value: projectName,
          },
          {
            name: 'Version',
            value: tag,
          },
          {
            name: 'Released',
            value: timestamp,
          },
          {
            name: 'Release Manager',
            value: releaseManager,
          },
          {
            name: 'Changelog',
            value: changelog,
          },
        ],
        markdown: true,
      },
    ],
  };

  return messageCard;
};

async function announceRelease(
  projectName: string,
  tag: string,
): Promise<void> {
  try {
    const commits = await fetchVersionCommits(tag);
    const changelog = await generateChangelog(commits);
    const releaseManager = await extractReleaseManager();
    const messageCard = generateMessageCard(
      projectName,
      tag,
      changelog,
      releaseManager,
    );
    const response = await fetch(TEAMS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageCard),
    });

    if (!response.ok) {
      throw new Error(
        `Teams webhook returned status ${response.status}: ${response.statusText}`,
      );
    }

    console.log('✅ Release announcement sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send release announcement:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: ts-node announce-release.ts <project-name> <tag>');
  console.error('Example: ts-node announce-release.ts "My Project" "v1.2.3"');
  process.exit(1);
}

const [projectName, tag] = args;

if (!projectName || !tag) {
  console.error('Project name and tag are required');
  process.exit(1);
}

// Run the announcement
announceRelease(projectName, tag);
