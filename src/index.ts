import { fetchVersionCommits, getProjectDetails } from '@/lib/gitlab';
import { generateChangelog } from '@/lib/changelog';
import { extractReleaseManager } from '@/lib/gitlab';
import { generateMessageCard } from '@/lib/teams';
import { extractPackageVersion } from '@/lib/package';
import 'dotenv/config';
async function announceRelease(): Promise<void> {
  const tag = extractPackageVersion();

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
    const response = await fetch(
      process.env.HERALD_TEAMS_WEBHOOK_URL as string,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageCard),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Teams webhook returned status ${response.status}: ${response.statusText}`,
      );
    }

    console.log('✅ Release announcement sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send release announcement:', error);
    process.exit(1);
  }
}

announceRelease();
