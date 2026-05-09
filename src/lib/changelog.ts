import { AI_SYSTEM_PROMPT } from "@/constants/ai";
import type { LocalCommit } from "@/types/git";

interface AiConfig {
	model: string;
	apiKey: string;
	baseUrl?: string;
}

const generateChangelog = async (
	commits: LocalCommit[],
	aiConfig: AiConfig,
) => {
	const baseUrl = aiConfig.baseUrl || "https://openrouter.ai/api/v1";

	const commitList = JSON.stringify(
		commits.map(({ author, message }) => ({ author, message })),
		null,
		2,
	);

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
					content: AI_SYSTEM_PROMPT,
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

	return content as string;
};

export { generateChangelog };
