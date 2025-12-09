import {
  gitlabCompareResponseSchema,
  gitlabProjectSchema,
  gitlabTagsResponseSchema,
  gitlabUserSchema,
} from '@/schema/gitlab';
import { isError } from '@/types/error';
import type { Commit, GitlabTag, GitlabUer } from '@/types/gitlab';
import { log } from '@clack/prompts';

const PAGE_SIZE = 100;

const getPreviousTag = async (version: string) => {
  const { GITLAB_BASE_URL, GITLAB_PROJECT_ID, GITLAB_TOKEN } = process.env;

  try {
    // TODO: It is better to recursively fetch tags until we find the previous tag
    const response = await fetch(
      `${GITLAB_BASE_URL}/projects/${GITLAB_PROJECT_ID}/repository/tags?per_page=${PAGE_SIZE}`,
      {
        headers: {
          Authorization: `Bearer ${GITLAB_TOKEN}`,
        },
      },
    );

    const tags = await response.json();

    const parsedTags = gitlabTagsResponseSchema.parse(tags);

    const semanticTags = parsedTags.filter((tag) =>
      tag.name.match(/^v\d+\.\d+\.\d+$/),
    );

    const tagIndex = semanticTags.findIndex(
      (tag: GitlabTag) => tag.name === version,
    );
    const previousTag = semanticTags[tagIndex + 1];

    if (!previousTag) {
      throw new Error('Previous tag not found.');
    }

    return previousTag;
  } catch (error) {
    log.error(`Failed to get previous tag: ${error}`);
    process.exit(1);
  }
};

const fetchVersionCommits = async (version: string) => {
  const { GITLAB_BASE_URL, GITLAB_PROJECT_ID, GITLAB_TOKEN } = process.env;

  if (!GITLAB_BASE_URL) {
    throw new Error('GITLAB_BASE_URL not provided');
  }

  if (!GITLAB_PROJECT_ID) {
    throw new Error('GITLAB_PROJECT_ID not provided');
  }

  if (!GITLAB_TOKEN) {
    throw new Error('GITLAB_TOKEN not provided');
  }

  try {
    const previousTag = await getPreviousTag(version);

    const response = await fetch(
      `${GITLAB_BASE_URL}/projects/${GITLAB_PROJECT_ID}/repository/compare?from=${previousTag.name}&to=${version}&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${GITLAB_TOKEN}`,
        },
      },
    );

    const commits = await response.json();

    const parsedCommits = gitlabCompareResponseSchema.parse(commits);

    const commitsWithoutTags = parsedCommits.commits.filter(
      (commit: Commit) => !commit.title.match(/^\d+\.\d+\.\d+(-\S+)?$/),
    );

    return commitsWithoutTags;
  } catch (error) {
    log.error(`Failed to fetch version commits: ${error}`);
    process.exit(1);
  }
};

const getReleaseManager = async () => {
  const { GITLAB_BASE_URL, GITLAB_TOKEN } = process.env;

  if (!GITLAB_BASE_URL) {
    throw new Error('GITLAB_BASE_URL not provided');
  }

  if (!GITLAB_TOKEN) {
    throw new Error('GITLAB_TOKEN not provided');
  }

  const response = await fetch(`${GITLAB_BASE_URL}/user`, {
    headers: {
      Authorization: `Bearer ${GITLAB_TOKEN}`,
    },
  });

  if (isError(response)) {
    throw new Error(response.message);
  }

  const data = await response.json();
  const user = gitlabUserSchema.parse(data);
  return user.name;
};

const getProjectDetails = async () => {
  const { GITLAB_BASE_URL, GITLAB_PROJECT_ID, GITLAB_TOKEN } = process.env;

  if (!GITLAB_PROJECT_ID) {
    throw new Error('GITLAB_PROJECT_ID not provided');
  }

  if (!GITLAB_BASE_URL) {
    throw new Error('GITLAB_BASE_URL not provided');
  }

  if (!GITLAB_TOKEN) {
    throw new Error('GITLAB_TOKEN not provided');
  }

  const response = await fetch(
    `${GITLAB_BASE_URL}/projects/${GITLAB_PROJECT_ID}`,
    {
      headers: {
        Authorization: `Bearer ${GITLAB_TOKEN}`,
      },
    },
  );

  if (isError(response)) {
    throw new Error(response.message);
  }

  const project = await response.json();
  return gitlabProjectSchema.parse(project);
};

export { fetchVersionCommits, getReleaseManager, getProjectDetails };
