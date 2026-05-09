import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { log } from "@clack/prompts";
import type { Args } from "@/lib/cli";
import { extractCustomPrompt } from "@/lib/prompt";
import type { HeraldConfig } from "@/schema/config";

const baseConfig: HeraldConfig = {
	providers: [{ type: "teams", webhookUrl: "https://example.com/hook" }],
	ai: { model: "openai/gpt-4o-mini", apiKey: "test-key" },
};

const emptyArgs = {} as Args;

describe("lib => extractCustomPrompt", () => {
	let tmpDir: string;
	const originalCwd = process.cwd();

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "herald-prompt-"));
		process.chdir(tmpDir);
	});

	afterEach(() => {
		process.chdir(originalCwd);
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it("returns empty string when neither CLI flag nor config field is set", () => {
		expect(extractCustomPrompt(emptyArgs, baseConfig)).toBe("");
	});

	it("reads the file referenced by config.promptFile", () => {
		const file = path.join(tmpDir, "rules.md");
		fs.writeFileSync(file, "- rule from config\n");

		const result = extractCustomPrompt(emptyArgs, {
			...baseConfig,
			promptFile: "rules.md",
		});

		expect(result).toBe("- rule from config\n");
	});

	it("reads the file referenced by the --prompt CLI flag", () => {
		const file = path.join(tmpDir, "cli.md");
		fs.writeFileSync(file, "- rule from cli\n");

		const result = extractCustomPrompt(
			{ prompt: "cli.md" } as Args,
			baseConfig,
		);

		expect(result).toBe("- rule from cli\n");
	});

	it("CLI --prompt overrides config.promptFile when both are set", () => {
		fs.writeFileSync(path.join(tmpDir, "config.md"), "- from config\n");
		fs.writeFileSync(path.join(tmpDir, "cli.md"), "- from cli\n");

		const result = extractCustomPrompt({ prompt: "cli.md" } as Args, {
			...baseConfig,
			promptFile: "config.md",
		});

		expect(result).toBe("- from cli\n");
	});

	it("resolves relative paths against the current working directory", () => {
		const subdir = path.join(tmpDir, "sub");
		fs.mkdirSync(subdir);
		fs.writeFileSync(path.join(subdir, "p.md"), "nested\n");

		const result = extractCustomPrompt(emptyArgs, {
			...baseConfig,
			promptFile: "sub/p.md",
		});

		expect(result).toBe("nested\n");
	});

	it("calls process.exit(1) when the prompt file is missing", () => {
		const exitSpy = mock((_code?: number) => {
			throw new Error("__exit__");
		});
		const originalExit = process.exit;
		const originalLogError = log.error;
		// biome-ignore lint/suspicious/noExplicitAny: process.exit replaced with a test double
		process.exit = exitSpy as any;
		log.error = mock(() => {});

		try {
			expect(() =>
				extractCustomPrompt(emptyArgs, {
					...baseConfig,
					promptFile: "missing.md",
				}),
			).toThrow("__exit__");
			expect(exitSpy).toHaveBeenCalledWith(1);
		} finally {
			process.exit = originalExit;
			log.error = originalLogError;
		}
	});
});
