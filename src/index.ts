import { cancel, intro, log, note, outro, spinner } from "@clack/prompts";
import { config } from "dotenv-flow";
import color from "picocolors";
import { generateChangelog } from "@/lib/changelog";
import { isCI } from "@/lib/ci";
import { parseCliArgs } from "@/lib/cli";
import { loadConfig } from "@/lib/config";
import { getCommitsBetween, getTags, resolveFromTag } from "@/lib/git";
import { selectChangelogItems } from "@/lib/interactive";
import { extractPackageVersion } from "@/lib/package";
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

		// Release tag from package.json version
		const releaseTag = extractPackageVersion();

		// Resolve previous tag for diff
		const fromTag = await resolveFromTag(tags, {
			from: args.from,
			releaseTag,
		});

		// Get commits
		s.start(`Fetching commits between ${fromTag} and HEAD (${releaseTag})`);
		const commits = getCommitsBetween(fromTag);

		if (commits.length === 0) {
			log.warn("No commits found between the selected tag and HEAD.");
			process.exit(0);
		}

		s.stop(`Found ${commits.length} commits`);

		// Load custom instructions (CLI flag overrides config)
		const customInstructions = extractCustomPrompt(args, config);

		// Generate changelog
		s.start("Generating changelog");
		let changelog = await generateChangelog(
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

		// Interactive changelog editor
		const interactive =
			(args.interactive ?? config.interactive ?? true) && !isCI();
		if (interactive) {
			const result = await selectChangelogItems(changelog);
			if (typeof result === "symbol") {
				cancel("Cancelled.");
				process.exit(0);
			}
			if (!result.trim()) {
				log.warn("No changelog items selected. Nothing to announce.");
				process.exit(0);
			}
			changelog = result;
			note(changelog, "Final Changelog");
		}

		// Announce to all providers
		await announce({ changelog, tag: releaseTag, config, spinner: s });

		outro("Release announced successfully!");
	} catch (error) {
		log.error(`Failed to announce release: ${error}`);
		process.exit(1);
	}
}

main();
