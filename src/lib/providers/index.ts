import { log } from "@clack/prompts";
import type { HeraldConfig, ProviderConfig } from "@/schema/config";
import type { Spinner } from "@/types/clack";
import type { AnnouncementProvider } from "@/types/provider";
import { getReleaseManager } from "../git";
import { getProjectName } from "../project";
import { ElementProvider } from "./element";
import { GitlabReleaseProvider } from "./gitlab-release";
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
	}
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
	const projectName = getProjectName(config);
	const releaseManager = getReleaseManager();

	const errors: Array<{ provider: string; error: unknown }> = [];

	for (const providerConfig of config.providers) {
		const provider = createProvider(providerConfig);
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

export { createProvider };
