import { afterEach, describe, expect, it, mock } from "bun:test";
import { generateChangelog } from "@/lib/changelog";
import type { LocalCommit } from "@/types/git";

const originalFetch = globalThis.fetch;

describe("lib => generateChangelog", () => {
	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it("sends author names with commit messages to the AI provider", async () => {
		const fetchMock = mock(async (_input: string | URL | Request, init?: RequestInit) => {
			const body = JSON.parse(String(init?.body));
			const userMessage = body.messages[1]?.content as string;

			expect(userMessage).toContain('"author": "Amirhossein Nouri"');
			expect(userMessage).toContain('"message": "feat: update herald"');
			expect(userMessage).toContain('"author": "Ebad Yousefzadeh"');

			return new Response(
				JSON.stringify({
					choices: [
						{
							message: {
								content: "- Updated Herald (Amirhossein Nouri)",
							},
						},
					],
				}),
				{
					status: 200,
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
		});

		// biome-ignore lint/suspicious/noExplicitAny: fetch is replaced with a test double
		globalThis.fetch = fetchMock as any;

		const commits: LocalCommit[] = [
			{
				hash: "1",
				author: "Amirhossein Nouri",
				title: "feat: update herald",
				message: "feat: update herald",
			},
			{
				hash: "2",
				author: "Ebad Yousefzadeh",
				title: 'feat: add "grill-me" skill',
				message: 'feat: add "grill-me" skill',
			},
		];

		const changelog = await generateChangelog(commits, {
			model: "openai/gpt-4o-mini",
			apiKey: "test-key",
		});

		expect(changelog).toBe("- Updated Herald (Amirhossein Nouri)");
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});
