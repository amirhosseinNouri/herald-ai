type TeamsMessageCard = {
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
};

export type { TeamsMessageCard };
