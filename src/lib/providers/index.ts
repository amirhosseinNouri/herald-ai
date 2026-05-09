import { confirm, isCancel, log } from "@clack/prompts";
import type { HeraldConfig, ProviderConfig } from "@/schema/config";
import type { Spinner } from "@/types/clack";
import type { AnnouncementProvider } from "@/types/provider";
import { isCI } from "../ci";
import { getReleaseManager } from "../git";
import { getProjectName } from "../project";
import { ElementProvider } from "./element";
import { GithubReleaseProvider } from "./github-release";
import { GitlabReleaseProvider } from "./gitlab-release";
import { SlackProvider } from "./slack";
import { TeamsProvider } from "./teams";
import { TelegramProvider } from "./telegram";

function createProvider(config: ProviderConfig): AnnouncementProvider {
	switch (config.type) {
		case "teams":
			return new TeamsProvider(config);
		case "gitlab-release":
			return new GitlabReleaseProvider(config);
		case "telegram":
			return new TelegramProvider(config);
		case "element":
			return new ElementProvider(config);
		case "github-release":
			return new GithubReleaseProvider(config);
		case "slack":
			return new SlackProvider(config);
	}
}

type ConfirmPublishPrompt = (options: { message: string }) => Promise<unknown>;

async function confirmProviderPublish(
	config: HeraldConfig,
	prompt: ConfirmPublishPrompt = confirm,
): Promise<void> {
	if (isCI() || !config.manualConfirm) {
		return;
	}

	const confirmed = await prompt({
		message: "Publish this release to the configured providers?",
	});

	if (isCancel(confirmed) || confirmed !== true) {
		log.warn("Announcement cancelled.");
		process.exit(0);
	}
}

async function confirmProviderAnnounce(
	config: HeraldConfig,
	providerName: string,
	prompt: ConfirmPublishPrompt = confirm,
): Promise<boolean> {
	if (isCI() || !config.confirmBeforePublish) {
		return true;
	}

	const confirmed = await prompt({
		message: `Publish to ${providerName}?`,
	});

	if (isCancel(confirmed) || confirmed !== true) {
		return false;
	}

	return true;
}

type AnnounceConfig = {
	config: HeraldConfig;
	spinner: Spinner;
	changelog: string;
	tag: string;
};

export async function announce({
	config,
	spinner,
	changelog,
	tag,
}: AnnounceConfig): Promise<void> {
	await confirmProviderPublish(config);

	const projectName = getProjectName(config);
	const releaseManager = getReleaseManager();

	const errors: Array<{ provider: string; error: unknown }> = [];

	for (const providerConfig of config.providers) {
		const provider = createProvider(providerConfig);
		const proceed = await confirmProviderAnnounce(config, provider.name);
		if (!proceed) {
			log.warn(`Skipped ${provider.name}.`);
			continue;
		}
		spinner.start(`Sending to ${provider.name}`);
		try {
			await provider.announce({
				projectName,
				tag,
				changelog,
				releaseManager,
			});
			spinner.stop(`Sent to ${provider.name}`);
		} catch (error) {
			spinner.stop(`Failed to send to ${provider.name}`);
			errors.push({ provider: provider.name, error });
		}
	}

	if (errors.length > 0) {
		for (const { provider, error } of errors) {
			log.error(`${provider}: ${error}`);
		}
		process.exit(1);
	}
}

export { createProvider, confirmProviderPublish, confirmProviderAnnounce };
