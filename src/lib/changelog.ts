import { generateText } from 'ai';
import { ollama } from 'ollama-ai-provider-v2';
import type { Commit } from '@/types/gitlab';
import { AI_SYSTEM_PROMPT } from '@/constants/ai';
import { logger } from './logger';

const generateChangelog = async (commits: Commit[]) => {
  if (!process.env.HERALD_AI_MODEL) {
    throw new Error('AI_MODEL not provided');
  }

  const data = await generateText({
    model: ollama(process.env.HERALD_AI_MODEL),
    prompt: `Create a changelog for the following commits: ${commits.map(
      (commit: Commit) => commit.message,
    )}`,
    system: AI_SYSTEM_PROMPT,
  });

  logger.info('✅ Changelog generated successfully');

  return data.text;
};

export { generateChangelog };
