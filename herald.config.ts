import { defineConfig } from "herald-ai";

export default defineConfig({
	ai: {
		model: process.env.OPENAI_MODEL!,
		apiKey: process.env.OPENAI_API_KEY!,
		baseUrl: process.env.OPENAI_BASE_URL,
	},
	providers: [
		{
			type: "element",
			homeserverUrl: process.env.ELEMENT_HOMESERVER_URL!,
			accessToken: process.env.ELEMENT_ACCESS_TOKEN!,
			roomId: process.env.ELEMENT_ROOM_ID!,
		},
		{ type: 'mattermost', webhookUrl: process.env.MATTERMOST_WEBHOOK_URL! }
	],
	promptFile: "./herald.prompt.md",
	manualConfirm: true,
});
