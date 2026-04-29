import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { confirmProviderPublish } from "@/lib/providers";
import type { HeraldConfig } from "@/schema/config";

const originalEnv = { ...process.env };
const originalExit = process.exit;
const mockExit = mock((code?: number) => {
	throw new Error(`process.exit:${code ?? ""}`);
});

const baseConfig: HeraldConfig = {
	ai: {
		model: "openai/gpt-4o-mini",
		apiKey: "test-key",
	},
	providers: [
		{
			type: "teams",
			webhookUrl: "https://example.com/webhook",
		},
	],
};

describe("lib => confirmProviderPublish", () => {
	beforeEach(() => {
		process.env = { ...originalEnv };
		delete process.env.CI;
		// biome-ignore lint/suspicious/noExplicitAny: mocking process.exit for tests
		(process.exit as any) = mockExit;
		mockExit.mockClear();
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		process.exit = originalExit;
	});

	it("skips confirmation when manualConfirm is disabled", async () => {
		const prompt = mock(async () => true);

		await confirmProviderPublish(baseConfig, prompt);

		expect(prompt).not.toHaveBeenCalled();
		expect(mockExit).not.toHaveBeenCalled();
	});

	it("skips confirmation in CI even when manualConfirm is enabled", async () => {
		process.env.CI = "true";
		const prompt = mock(async () => true);

		await confirmProviderPublish(
			{ ...baseConfig, manualConfirm: true },
			prompt,
		);

		expect(prompt).not.toHaveBeenCalled();
		expect(mockExit).not.toHaveBeenCalled();
	});

	it("prompts for confirmation outside CI when manualConfirm is enabled", async () => {
		const prompt = mock(async () => true);

		await confirmProviderPublish(
			{ ...baseConfig, manualConfirm: true },
			prompt,
		);

		expect(prompt).toHaveBeenCalledWith({
			message: "Publish this release to the configured providers?",
		});
		expect(mockExit).not.toHaveBeenCalled();
	});

	it("cancels publishing when confirmation is declined", async () => {
		const prompt = mock(async () => false);

		expect(
			confirmProviderPublish({ ...baseConfig, manualConfirm: true }, prompt),
		).rejects.toThrow("process.exit:0");
		expect(mockExit).toHaveBeenCalledWith(0);
	});
});
