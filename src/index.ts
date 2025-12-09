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

  const s = spinner();

  s.start('Extracting package version');
  const tag = extractPackageVersion();
  s.stop(`Package version: ${tag}`);

  try {
    s.start('Extracting project details');
    const projectDetails = await getProjectDetails();
    s.stop(`Project ${projectDetails.name} details extracted`);

    s.start('Extracting changed commits');
    const commits = await fetchVersionCommits(tag);
    s.stop(`${commits.length} changed commits extracted`);

    s.start('Generating changelog');
    const changelog = await generateChangelog(commits);
    s.stop('Changelog generated');

    s.start('Extracting release manager');
    const releaseManager = await extractReleaseManager();
    s.stop(`Release manager: ${releaseManager}`);

    s.start('Generating teams message');
    const messageCard = generateMessageCard(
      projectDetails.name,
      tag,
      changelog,
      releaseManager,
    );
    s.stop('Teams message generated');

    s.start('Sending teams message');
    await sendMessageToChannel(messageCard);
    s.stop('Teams message sent successfully');
  } catch (error) {
    console.error('❌ Failed to send release announcement:', error);
    process.exit(1);
  }
}

announceRelease();
