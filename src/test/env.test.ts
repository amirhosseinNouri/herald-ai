import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { interpolateEnvVars } from "@/lib/env";

describe("lib => interpolateEnvVars", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env.TEST_API_KEY = "sk-secret-123";
		process.env.TEST_WEBHOOK = "https://example.com/hook";
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("should interpolate $VAR syntax", () => {
		const result = interpolateEnvVars("$TEST_API_KEY");
		expect(result).toBe("sk-secret-123");
	});

	// biome-ignore lint/suspicious/noTemplateCurlyInString: testing env var interpolation
	it("should interpolate ${VAR} syntax", () => {
		// biome-ignore lint/suspicious/noTemplateCurlyInString: testing env var interpolation
		const result = interpolateEnvVars("${TEST_API_KEY}");
		expect(result).toBe("sk-secret-123");
	});

	it("should leave unmatched vars as-is", () => {
		const result = interpolateEnvVars("$NONEXISTENT_VAR");
		expect(result).toBe("$NONEXISTENT_VAR");
	});

	it("should recursively interpolate objects", () => {
		const input = {
			ai: {
				apiKey: "$TEST_API_KEY",
				model: "gpt-4",
			},
			providers: [
				{
					type: "teams",
					// biome-ignore lint/suspicious/noTemplateCurlyInString: testing env var interpolation
					webhookUrl: "${TEST_WEBHOOK}",
				},
			],
		};

		const result = interpolateEnvVars(input);

		expect(result).toEqual({
			ai: {
				apiKey: "sk-secret-123",
				model: "gpt-4",
			},
			providers: [
				{
					type: "teams",
					webhookUrl: "https://example.com/hook",
				},
			],
		});
	});

	it("should not modify non-string primitives", () => {
		expect(interpolateEnvVars(42)).toBe(42);
		expect(interpolateEnvVars(true)).toBe(true);
		expect(interpolateEnvVars(null)).toBe(null);
	});
});
