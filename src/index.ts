import { fetchVersionCommits } from '@/lib/gitlab';
import { generateChangelog } from '@/lib/changelog';
import { extractReleaseManager } from '@/lib/gitlab';
import { generateMessageCard } from '@/lib/teams';
import { extractPackageVersion } from '@/lib/package';
async function announceRelease(): Promise<void> {
  const tag = extractPackageVersion();

  try {
    const commits = await fetchVersionCommits(tag);
    const changelog = await generateChangelog(commits);
    const releaseManager = await extractReleaseManager();
    const messageCard = generateMessageCard(
      process.env.GITLAB_PROJECT_SLUG as string,
      tag,
      changelog,
      releaseManager,
    );
    const response = await fetch(process.env.TEAMS_WEBHOOK_URL as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageCard),
    });

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
