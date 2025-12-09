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

const sendMessageToChannel = async (messageCard: TeamsMessageCard) => {
  if (!process.env.TEAMS_WEBHOOK_URL) {
    throw new Error('TEAMS_WEBHOOK_URL not provided');
  }

  const response = await fetch(process.env.TEAMS_WEBHOOK_URL, {
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
};

export { generateMessageCard, sendMessageToChannel };
