import { AI_SYSTEM_PROMPT } from "@/constants/ai";
import { getCached, setCached } from "@/lib/cache";
import type { LocalCommit } from "@/types/git";

interface AiConfig {
	model: string;
	apiKey: string;
	baseUrl?: string;
}

const generateChangelog = async (
	commits: LocalCommit[],
	aiConfig: AiConfig,
	template?: string,
	cache?: boolean,
) => {
	const commitMessages = commits.map((commit) => commit.message);

	if (cache) {
		const cached = getCached(commitMessages);
		if (cached) {
			return cached;
		}
	}

	const baseUrl = aiConfig.baseUrl || "https://openrouter.ai/api/v1";

	const commitList = commitMessages.map((m) => `- ${m}`).join("\n");

	const response = await fetch(`${baseUrl}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${aiConfig.apiKey}`,
			"X-Title": "Herald",
		},
		body: JSON.stringify({
			model: aiConfig.model,
			messages: [
				{
					role: "system",
					content: template ?? AI_SYSTEM_PROMPT,
				},
				{
					role: "user",
					content: `Create a changelog for the following commits:\n${commitList}`,
				},
			],
		}),
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`AI API error (${response.status}): ${body}`);
	}

	const data = await response.json();
	const content = data.choices?.[0]?.message?.content;

	if (!content) {
		throw new Error(
			`AI returned no content: ${JSON.stringify(data).slice(0, 500)}`,
		);
	}

	if (cache) {
		setCached(commitMessages, content as string);
	}

	return content as string;
};

export { generateChangelog };
