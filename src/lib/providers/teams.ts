import type {
	AnnouncementPayload,
	AnnouncementProvider,
} from "@/types/provider";

interface TeamsMessageCard {
	"@type": string;
	"@context": string;
	themeColor: string;
	summary: string;
	sections: Array<{
		activityTitle: string;
		activitySubtitle?: string;
		activityImage?: string;
		facts: Array<{
			name: string;
			value: string;
		}>;
		markdown: boolean;
	}>;
}

interface TeamsProviderConfig {
	type: "teams";
	webhookUrl: string;
}

class TeamsProvider implements AnnouncementProvider {
	name = "Microsoft Teams";
	private webhookUrl: string;

	constructor(config: TeamsProviderConfig) {
		this.webhookUrl = config.webhookUrl;
	}

	async announce(payload: AnnouncementPayload): Promise<void> {
		const timestamp = new Date().toLocaleString();

		const messageCard: TeamsMessageCard = {
			"@type": "MessageCard",
			"@context": "https://schema.org/extensions",
			themeColor: "0078D7",
			summary: `${payload.projectName} ${payload.tag} Released`,
			sections: [
				{
					activityTitle: `${payload.projectName} version ${payload.tag} is now on production!`,
					facts: [
						{ name: "Project", value: payload.projectName },
						{ name: "Version", value: payload.tag },
						{ name: "Released", value: timestamp },
						{ name: "Release Manager", value: payload.releaseManager },
						{ name: "Changelog", value: payload.changelog },
					],
					markdown: true,
				},
			],
		};

		const response = await fetch(this.webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(messageCard),
		});

		if (!response.ok) {
			throw new Error(
				`Teams webhook returned status ${response.status}: ${response.statusText}`,
			);
		}
	}
}

export { TeamsProvider };
