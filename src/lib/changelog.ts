import { generateText } from 'ai';
import { ollama } from 'ollama-ai-provider-v2';
import type { Commit } from '@/types/gitlab';

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

export { generateChangelog };
