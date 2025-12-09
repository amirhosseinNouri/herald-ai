import type { TeamsMessageCard } from '@/types/teams';

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

export { generateMessageCard };
