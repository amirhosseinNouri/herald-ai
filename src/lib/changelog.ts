import type { Commit } from '@/types/gitlab';
import { AI_SYSTEM_PROMPT } from '@/constants/ai';
import { log } from '@clack/prompts';
import { OpenRouter } from '@openrouter/sdk';

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

  try {
    const openRouter = new OpenRouter({
      apiKey: process.env.AI_API_KEY,
    });
    const completion = await openRouter.chat.send({
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
      stream: false,
    });

    if (!completion.choices[0]?.message.content) {
      throw new Error('Failed to generate changelog');
    }

    return completion.choices[0].message.content as string;
  } catch (error) {
    log.error(`Failed to generate changelog: ${error}`);
    process.exit(1);
  }
};

export { generateChangelog };
