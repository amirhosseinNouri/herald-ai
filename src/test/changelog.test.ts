import { afterEach, describe, expect, it, mock } from "bun:test";
import { generateChangelog } from "@/lib/changelog";
import type { LocalCommit } from "@/types/git";

const originalFetch = globalThis.fetch;

describe("lib => generateChangelog", () => {
	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it("sends author names with commit messages to the AI provider", async () => {
		const fetchMock = mock(
			async (_input: string | URL | Request, init?: RequestInit) => {
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
			},
		);

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

	it("appends custom instructions inside a <custom-instructions> block in the system prompt", async () => {
		const customInstructions =
			"- Skip release commits\n- Group dependency bumps";

		const fetchMock = mock(
			async (_input: string | URL | Request, init?: RequestInit) => {
				const body = JSON.parse(String(init?.body));
				const systemMessage = body.messages[0]?.content as string;

				expect(systemMessage).toContain("<custom-instructions>");
				expect(systemMessage).toContain(customInstructions);
				expect(systemMessage).toContain("</custom-instructions>");
				expect(systemMessage.indexOf("<custom-instructions>")).toBeGreaterThan(
					0,
				);

				return new Response(
					JSON.stringify({
						choices: [{ message: { content: "- Item" } }],
					}),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				);
			},
		);

		// biome-ignore lint/suspicious/noExplicitAny: fetch is replaced with a test double
		globalThis.fetch = fetchMock as any;

		const commits: LocalCommit[] = [
			{
				hash: "1",
				author: "Amirhossein Nouri",
				title: "feat: x",
				message: "feat: x",
			},
		];

		await generateChangelog(
			commits,
			{ model: "openai/gpt-4o-mini", apiKey: "test-key" },
			customInstructions,
		);

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("does not include a <custom-instructions> block when no instructions are provided", async () => {
		const fetchMock = mock(
			async (_input: string | URL | Request, init?: RequestInit) => {
				const body = JSON.parse(String(init?.body));
				const systemMessage = body.messages[0]?.content as string;

				expect(systemMessage).not.toContain("<custom-instructions>");

				return new Response(
					JSON.stringify({
						choices: [{ message: { content: "- Item" } }],
					}),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				);
			},
		);

		// biome-ignore lint/suspicious/noExplicitAny: fetch is replaced with a test double
		globalThis.fetch = fetchMock as any;

		await generateChangelog(
			[
				{
					hash: "1",
					author: "Amirhossein Nouri",
					title: "feat: x",
					message: "feat: x",
				},
			],
			{ model: "openai/gpt-4o-mini", apiKey: "test-key" },
		);

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});
