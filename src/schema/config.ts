import { z } from "zod";

const gitlabReleaseProviderSchema = z.object({
	type: z.literal("gitlab-release"),
	baseUrl: z.url(),
	token: z.string(),
	projectId: z.string(),
});

const teamsProviderSchema = z.object({
	type: z.literal("teams"),
	webhookUrl: z.url(),
});

const elementProviderSchema = z.object({
	type: z.literal("element"),
	homeserverUrl: z.url(),
	accessToken: z.string(),
	roomId: z.string(),
});

const telegramProviderSchema = z.object({
	type: z.literal("telegram"),
	botToken: z.string(),
	chatId: z.string(),
});

const githubReleaseProviderSchema = z.object({
	type: z.literal("github-release"),
	token: z.string(),
	owner: z.string(),
	repo: z.string(),
});

const slackProviderSchema = z.object({
	type: z.literal("slack"),
	webhookUrl: z.url(),
});

const providerSchema = z.discriminatedUnion("type", [
	gitlabReleaseProviderSchema,
	teamsProviderSchema,
	elementProviderSchema,
	telegramProviderSchema,
	githubReleaseProviderSchema,
	slackProviderSchema,
]);

const configSchema = z.object({
	providers: z.array(providerSchema).min(1),
	ai: z.object({
		model: z.string(),
		apiKey: z.string(),
		baseUrl: z.url().optional(),
	}),
	promptFile: z.string().optional(),
	manualConfirm: z.boolean().optional(),
	projectName: z.string().optional(),
	debug: z.boolean().optional(),
});

export type HeraldConfig = z.infer<typeof configSchema>;
export type ProviderConfig = z.infer<typeof providerSchema>;

export { configSchema };
