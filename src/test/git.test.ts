import { afterEach, describe, expect, it } from "bun:test";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getCommitsBetween } from "@/lib/git";

function run(command: string, cwd: string, env?: NodeJS.ProcessEnv): string {
	return execSync(command, {
		cwd,
		encoding: "utf-8",
		env: {
			...process.env,
			...env,
		},
	});
}

describe("lib => getCommitsBetween", () => {
	const originalCwd = process.cwd();
	const tempDirs: string[] = [];

	afterEach(() => {
		process.chdir(originalCwd);

		for (const tempDir of tempDirs) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}

		tempDirs.length = 0;
	});

	it("captures commit authors from git history", () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "herald-git-"));
		tempDirs.push(tempDir);

		run("git init", tempDir);
		run('git config user.name "Test User"', tempDir);
		run('git config user.email "test@example.com"', tempDir);

		fs.writeFileSync(path.join(tempDir, "README.md"), "first\n");
		run("git add README.md", tempDir);
		run('git commit -m "feat: initial release"', tempDir);
		run("git tag v1.0.0", tempDir);

		fs.writeFileSync(path.join(tempDir, "README.md"), "second\n");
		run("git add README.md", tempDir);
		run('git commit -m "feat: add skill" -m "extra details"', tempDir, {
			GIT_AUTHOR_NAME: "Ebad Yousefzadeh",
			GIT_AUTHOR_EMAIL: "ebad@example.com",
			GIT_COMMITTER_NAME: "Ebad Yousefzadeh",
			GIT_COMMITTER_EMAIL: "ebad@example.com",
		});

		process.chdir(tempDir);

		expect(getCommitsBetween("v1.0.0")).toEqual([
			{
				hash: expect.any(String),
				author: "Ebad Yousefzadeh",
				title: "feat: add skill",
				message: "feat: add skill\n\nextra details",
			},
		]);
	});
});
