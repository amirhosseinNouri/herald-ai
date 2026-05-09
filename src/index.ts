import { intro, log, note, outro, spinner } from "@clack/prompts";
import { config } from "dotenv-flow";
import color from "picocolors";
import { generateChangelog } from "@/lib/changelog";
import { parseCliArgs } from "@/lib/cli";
import { loadConfig } from "@/lib/config";
import { getCommitsBetween, getTags, resolveTargetTag } from "@/lib/git";
import { announce } from "@/lib/providers";
import packageJson from "../package.json";
import { extractCustomPrompt } from "./lib/prompt";

config({ silent: true });

async function main(): Promise<void> {
	const args = parseCliArgs();
	const config = await loadConfig(args.config);
	const debug = args.debug || Boolean(config.debug);

	intro(
		color.bgBlueBright(`Herald changelog generator v${packageJson.version}`),
	);

	const s = spinner();

	try {
		// Get tags
		s.start("Fetching git tags");
		const tags = getTags();
		s.stop(`Found ${tags.length} tags`);

		if (tags.length === 0) {
			log.error("No semver tags found in this repository.");
			process.exit(1);
		}

		// Resolve target tag
		const targetTag = await resolveTargetTag(tags, {
			from: args.from,
		});

		// Get commits
		s.start(`Fetching commits between ${targetTag} and HEAD`);
		const commits = getCommitsBetween(targetTag);

		if (commits.length === 0) {
			log.warn("No commits found between the selected tag and HEAD.");
			process.exit(0);
		}

		s.stop(`Found ${commits.length} commits`);

		// Load custom instructions (CLI flag overrides config)
		const customInstructions = extractCustomPrompt(args, config);

		// Generate changelog
		s.start("Generating changelog");
		const changelog = await generateChangelog(
			commits,
			config.ai,
			customInstructions,
		);
		s.stop("Changelog generated");

		note(changelog, "Generated Changelog");

		if (debug) {
			outro("Debug mode: no announcements sent.");
			return;
		}

		// Announce to all providers
		await announce({ changelog, tag: targetTag, config, spinner: s });

		outro("Release announced successfully!");
	} catch (error) {
		log.error(`Failed to announce release: ${error}`);
		process.exit(1);
	}
}

main();
