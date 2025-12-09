import path from "node:path";
import { intro, log, spinner } from "@clack/prompts";
import dotenv from "dotenv";
import color from "picocolors";
import { generateChangelog } from "@/lib/changelog";
import {
	fetchVersionCommits,
	getProjectDetails,
	getReleaseManager,
} from "@/lib/gitlab";
import { extractPackageVersion } from "@/lib/package";
import { generateMessageCard, sendMessageToChannel } from "@/lib/teams";

dotenv.config({
	path: path.join(process.cwd(), ".env"),
	debug: false,
});
dotenv.config({
	path: path.join(process.cwd(), ".env.local"),
	debug: false,
});

async function announceRelease(): Promise<void> {
	intro(color.bgBlueBright("Herald changelog generator"));

	const s = spinner();

	try {
		// Package json version
		s.start("Extracting package version");
		const tag = extractPackageVersion();
		s.stop(`Package version: ${tag}`);

		// Project details
		s.start("Extracting project details");
		const projectDetails = await getProjectDetails();
		s.stop(`Project ${projectDetails.name} details extracted`);

		// Changed commits
		s.start("Extracting changed commits");
		const commits = await fetchVersionCommits(tag);
		s.stop(`${commits.length} changed commits extracted`);

		// Generate changelog
		s.start("Generating changelog");
		const changelog = await generateChangelog(commits);
		s.stop("Changelog generated");

		// Extract release manager
		s.start("Extracting release manager");
		const releaseManager = await getReleaseManager();
		s.stop(`Release manager: ${releaseManager}`);

		// Generate teams message
		s.start("Generating teams message");
		const messageCard = generateMessageCard(
			projectDetails.name,
			tag,
			changelog,
			releaseManager,
		);
		s.stop("Teams message generated");

		// Send teams message
		s.start("Sending teams message");
		await sendMessageToChannel(messageCard);
		s.stop("Teams message sent successfully");
	} catch (error) {
		log.error(`Failed to announce release: ${error}`);
		process.exit(1);
	}
}

announceRelease();
