import type {
  Commit,
  GitlabProject,
  GitlabTag,
  GitlabUer,
} from '@/types/gitlab';
import { logger } from './logger';

const fetchVersionCommits = async (version: string) => {
  const tags = await fetch(
    `${process.env.GITLAB_BASE_URL}/projects/${process.env.GITLAB_PROJECT_ID}/repository/tags`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITLAB_TOKEN}`,
      },
    },
  );
  logger.info('✅ Fetched git tags from GitLab');
  const tagsData = (await tags.json()) as GitlabTag[];
  console.log(tagsData);
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
    `${process.env.GITLAB_BASE_URL}/projects/${process.env.GITLAB_PROJECT_ID}/repository/compare?from=${previousTag.name}&to=${version}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITLAB_TOKEN}`,
      },
    },
  );

  logger.info('✅ Fetched changed commits from GitLab');

  const data = (await commits.json()) as { commits: Commit[] };

  const commitsWithoutTags = data.commits.filter(
    (commit: Commit) => !commit.title.match(/^\d+\.\d+\.\d+(-\S+)?$/),
  );

  return commitsWithoutTags;
};

const extractReleaseManager = async () => {
  const response = await fetch(`${process.env.GITLAB_BASE_URL}/user`, {
    headers: {
      Authorization: `Bearer ${process.env.GITLAB_TOKEN}`,
    },
  });

  logger.info('✅ Fetched release manager from GitLab');

  const user = (await response.json()) as GitlabUer;
  return user.name;
};

const getProjectDetails = async () => {
  const response = await fetch(
    `${process.env.GITLAB_BASE_URL}/projects/${process.env.GITLAB_PROJECT_ID}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITLAB_TOKEN}`,
      },
    },
  );

  logger.info('✅ Fetched project details from GitLab');

  const project = (await response.json()) as GitlabProject;
  return project;
};

export { fetchVersionCommits, extractReleaseManager, getProjectDetails };
