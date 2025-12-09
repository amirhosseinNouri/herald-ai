import dotenv from 'dotenv';
import path from 'path';
dotenv.config({
  path: path.join(process.cwd(), '.env'),
  debug: process.env.NODE_ENV === 'development',
});
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

  // Package json version
  s.start('Extracting package version');
  const tag = extractPackageVersion();
  s.stop(`Package version: ${tag}`);

  // Project details
  s.start('Extracting project details');
  const projectDetails = await getProjectDetails();
  s.stop(`Project ${projectDetails.name} details extracted`);

  // Changed commits
  s.start('Extracting changed commits');
  const commits = await fetchVersionCommits(tag);
  s.stop(`${commits.length} changed commits extracted`);

  // Generate changelog
  s.start('Generating changelog');
  const changelog = await generateChangelog(commits);
  s.stop('Changelog generated');

  // Extract release manager
  s.start('Extracting release manager');
  const releaseManager = await extractReleaseManager();
  s.stop(`Release manager: ${releaseManager}`);

  // Generate teams message
  s.start('Generating teams message');
  const messageCard = generateMessageCard(
    projectDetails.name,
    tag,
    changelog,
    releaseManager,
  );
  s.stop('Teams message generated');

  // Send teams message
  s.start('Sending teams message');
  await sendMessageToChannel(messageCard);
  s.stop('Teams message sent successfully');
}

announceRelease();
