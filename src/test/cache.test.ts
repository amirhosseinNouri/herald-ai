import { afterEach, describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getCached, setCached } from "@/lib/cache";
import type { LocalCommit } from "@/types/git";

describe("lib => cache", () => {
	const originalCwd = process.cwd();
	const tempDirs: string[] = [];

	afterEach(() => {
		process.chdir(originalCwd);

		for (const tempDir of tempDirs) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}

		tempDirs.length = 0;
	});

	it("keys cached changelogs by author and message", () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "herald-cache-"));
		tempDirs.push(tempDir);
		process.chdir(tempDir);

		const commitsByAmir: LocalCommit[] = [
			{
				hash: "1",
				author: "Amirhossein Nouri",
				title: "feat: update herald",
				message: "feat: update herald",
			},
		];

		const commitsByEbad: LocalCommit[] = [
			{
				hash: "2",
				author: "Ebad Yousefzadeh",
				title: "feat: update herald",
				message: "feat: update herald",
			},
		];

		setCached(commitsByAmir, "- Updated Herald (Amirhossein Nouri)");

		expect(getCached(commitsByAmir)).toBe(
			"- Updated Herald (Amirhossein Nouri)",
		);
		expect(getCached(commitsByEbad)).toBeUndefined();
	});
});
