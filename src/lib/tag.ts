import type { Spinner } from "@clack/prompts";
import { extractPackageVersion, parseTag } from "./package";

/**
 * Extracts the tag to use for the release announcement.
 * Either from command line arguments (--tag) or from package.json version.
 */
const extractTag = (s: Spinner): string => {
	const args = process.argv.slice(2);
	const tagIndex = args.indexOf("--tag");

	if (tagIndex !== -1 && args[tagIndex + 1]) {
		// Use tag from command line
		s.start("Using provided tag");
		const tag = parseTag(args[tagIndex + 1]);
		s.stop(`Using tag: ${tag}`);
		return tag;
	}

	// Package json version
	s.start("Extracting package version");
	const tag = extractPackageVersion();
	s.stop(`Package version: ${tag}`);
	return tag;
};

export { extractTag };
