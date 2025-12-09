import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });
import { intro, spinner } from '@clack/prompts';
import color from 'picocolors';

import { fetchVersionCommits, getProjectDetails } from '@/lib/gitlab';
import { generateChangelog } from '@/lib/changelog';
import { extractReleaseManager } from '@/lib/gitlab';
import { generateMessageCard, sendMessageToChannel } from '@/lib/teams';
import { extractPackageVersion } from '@/lib/package';

async function announceRelease(): Promise<void> {
  intro(color.bgBlueBright('Herald changelog generator'));

  const loading = spinner();

  loading.start('Extracting package version...');
  const tag = extractPackageVersion();
  loading.stop(`Package version: ${tag}`);

  try {
    loading.start('Extracting project details');
    const projectDetails = await getProjectDetails();
    loading.stop(`Project ${projectDetails.name} details extracted`);

    loading.start('Extracting changed commits...');
    const commits = await fetchVersionCommits(tag);
    loading.stop(`${commits.length} changed commits extracted`);

    loading.start('Generating changelog...');
    const changelog = await generateChangelog(commits);
    loading.stop('Changelog generated');

    loading.start('Extracting release manager...');
    const releaseManager = await extractReleaseManager();
    loading.stop(`Release manager: ${releaseManager}`);

    loading.start('Generating teams message...');
    const messageCard = generateMessageCard(
      projectDetails.name,
      tag,
      changelog,
      releaseManager,
    );
    loading.stop('Teams message generated');

    loading.start('Sending teams message...');
    await sendMessageToChannel(messageCard);
    loading.stop('Teams message sent successfully');
  } catch (error) {
    console.error('❌ Failed to send release announcement:', error);
    process.exit(1);
  }
}

announceRelease();
