import { fetchVersionCommits, getProjectDetails } from '@/lib/gitlab';
import { generateChangelog } from '@/lib/changelog';
import { extractReleaseManager } from '@/lib/gitlab';
import { generateMessageCard, sendMessageToChannel } from '@/lib/teams';
import { extractPackageVersion } from '@/lib/package';
import { config } from 'dotenv';
import { logger } from '@/lib/logger';

config({ path: process.cwd() + '/.env' });
async function announceRelease(): Promise<void> {
  const tag = extractPackageVersion();

  logger.info(`Generating changelog for version ${tag}`);

  try {
    const commits = await fetchVersionCommits(tag);
    const changelog = await generateChangelog(commits);
    const releaseManager = await extractReleaseManager();
    const projectDetails = await getProjectDetails();
    const messageCard = generateMessageCard(
      projectDetails.name,
      tag,
      changelog,
      releaseManager,
    );
    await sendMessageToChannel(messageCard);
  } catch (error) {
    console.error('❌ Failed to send release announcement:', error);
    process.exit(1);
  }
}

announceRelease();
