import type { Commit } from '@/types/gitlab';
import { AI_SYSTEM_PROMPT } from '@/constants/ai';
import { OpenAI } from 'openai';
import { log } from '@clack/prompts';

const generateChangelog = async (commits: Commit[]) => {
  if (!process.env.AI_MODEL) {
    log.error('AI_MODEL not provided');
    process.exit(1);
  }

  if (!process.env.AI_API_KEY) {
    log.error('AI_API_KEY not provided');
    process.exit(1);
  }

  if (!process.env.AI_BASE_URL) {
    log.error('AI_BASE_URL not provided');
    process.exit(1);
  }

  const openai = new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL,
  });

  try {
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL,
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

    if (!response.choices[0]?.message.content) {
      throw new Error('Failed to generate changelog');
    }

    return response.choices[0].message.content;
  } catch (error) {
    log.error(`Failed to generate changelog: ${error}`);
    process.exit(1);
  }
};

export { generateChangelog };
