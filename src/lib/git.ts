import { execSync } from "node:child_process";
import { isCancel, log, select } from "@clack/prompts";
import type { GitTag, LocalCommit } from "@/types/git";
import { isCI } from "./ci";

const SEMVER_REGEX = /^v?\d+\.\d+\.\d+/;
const DELIMITER = "|||";

function getTags(): GitTag[] {
	try {
		const output = execSync(
			"git tag --sort=-creatordate --format='%(refname:short)|%(creatordate:iso8601)'",
			{ encoding: "utf-8" },
		);

		return output
			.trim()
			.split("\n")
			.filter((line) => line.length > 0)
			.map((line) => {
				const [name, date] = line.split("|") as [string, string];
				return { name: name.trim(), date: date.trim() };
			})
			.filter((tag) => SEMVER_REGEX.test(tag.name));
	} catch {
		throw new Error(
			"Failed to read git tags. Make sure you are in a git repository.",
		);
	}
}

function getCommitForRef(ref: string): string {
	return execSync(`git rev-parse ${ref}^{commit}`, {
		encoding: "utf-8",
	}).trim();
}

function getLatestTag(tags: GitTag[]): GitTag {
	if (tags.length === 0) {
		throw new Error("No semver tags found in this repository.");
	}

	const headCommit = getCommitForRef("HEAD");

	for (const tag of tags) {
		const tagCommit = getCommitForRef(tag.name);
		if (tagCommit !== headCommit) {
			return tag;
		}
	}

	throw new Error(
		"All semver tags point to HEAD. Cannot determine a diff range.",
	);
}

function getCommitsBetween(fromTag: string): LocalCommit[] {
	try {
		const format = `%H|%an|%s|%B${DELIMITER}`;
		const output = execSync(
			`git log ${fromTag}..HEAD --pretty=format:"${format}"`,
			{ encoding: "utf-8" },
		);

		if (!output.trim()) {
			return [];
		}

		return output
			.split(DELIMITER)
			.filter((entry) => entry.trim().length > 0)
			.map((entry) => {
				const trimmed = entry.trim();
				const firstPipe = trimmed.indexOf("|");
				const secondPipe = trimmed.indexOf("|", firstPipe + 1);
				const thirdPipe = trimmed.indexOf("|", secondPipe + 1);

				const hash = trimmed.substring(0, firstPipe);
				const author = trimmed.substring(firstPipe + 1, secondPipe);
				const title = trimmed.substring(secondPipe + 1, thirdPipe);
				const message = trimmed.substring(thirdPipe + 1).trim();

				return { hash, author, title, message };
			});
	} catch {
		throw new Error(`Failed to get commits between ${fromTag} and HEAD.`);
	}
}

function getReleaseManager(): string {
	const ciUser = process.env.GITLAB_USER_NAME ?? process.env.GITHUB_ACTOR;
	if (ciUser) return ciUser;

	try {
		return execSync("git config user.name", { encoding: "utf-8" }).trim();
	} catch {
		return "Unknown";
	}
}

async function resolveTargetTag(
	tags: GitTag[],
	options: { from?: string },
): Promise<string> {
	if (options.from) {
		log.info(`Using tag: ${options.from}`);
		return options.from;
	}

	const ci = isCI();

	if (ci) {
		const latest = getLatestTag(tags);
		log.info(`CI mode: using latest tag ${latest.name} (${latest.date})`);
		return latest.name;
	}

	const selected = await select({
		message: "Select a tag to diff against HEAD",
		options: tags.map((t) => ({
			value: t.name,
			label: t.name,
			hint: t.date,
		})),
	});

	if (isCancel(selected)) {
		log.warn("Operation cancelled.");
		process.exit(0);
	}

	return selected as string;
}

export {
	getTags,
	getLatestTag,
	getCommitsBetween,
	getReleaseManager,
	resolveTargetTag,
};
