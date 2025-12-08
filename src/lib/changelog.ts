import type { Commit } from '@/types/gitlab';
import { AI_SYSTEM_PROMPT } from '@/constants/ai';
import { logger } from './logger';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.HERALD_AI_API_KEY,
  baseURL: process.env.HERALD_AI_BASE_URL,
});

const generateChangelog = async (commits: Commit[]) => {
  if (!process.env.HERALD_AI_MODEL) {
    throw new Error('HERALD_AI_MODEL not provided');
  }

  const response = await openai.chat.completions.create({
    model: process.env.HERALD_AI_MODEL,
    messages: [
      {
        role: 'user',
        content: `Create a changelog for the following commits: ${commits.map(
          (commit: Commit) => commit.message,
        )}`,
      },
      {
        role: 'system',
        content: AI_SYSTEM_PROMPT,
      },
    ],
  });

  logger.info('✅ Changelog generated successfully');

  if (!response.choices[0]?.message.content) {
    throw new Error('Failed to generate changelog');
  }

  return response.choices[0].message.content;
};

export { generateChangelog };
