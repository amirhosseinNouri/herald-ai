import type {
	AnnouncementPayload,
	AnnouncementProvider,
} from "@/types/provider";

interface MattermostAttachment {
	fallback: string;
	color?: string;
	text?: string;
	fields?: Array<{ title: string; value: string; short?: boolean }>;
}

interface MattermostMessage {
	text: string;
	attachments?: MattermostAttachment[];
}

interface MattermostProviderConfig {
	type: "mattermost";
	webhookUrl: string;
}

class MattermostProvider implements AnnouncementProvider {
	name = "Mattermost";
	private webhookUrl: string;

	constructor(config: MattermostProviderConfig) {
		this.webhookUrl = config.webhookUrl;
	}

	async announce(payload: AnnouncementPayload): Promise<void> {
		const summary = `${payload.projectName} ${payload.tag} Released`;

		const message: MattermostMessage = {
			text: `#### ${summary}`,
			attachments: [
				{
					fallback: summary,
					color: "#2eb886",
					fields: [
						{
							title: "Project",
							value: payload.projectName,
							short: true,
						},
						{ title: "Version", value: payload.tag, short: true },
						{
							title: "Release Manager",
							value: payload.releaseManager,
							short: true,
						},
					],
					text: payload.changelog,
				},
			],
		};

		const response = await fetch(this.webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(message),
		});

		if (!response.ok) {
			const body = await response.text();
			throw new Error(
				`Mattermost webhook returned status ${response.status}: ${body}`,
			);
		}
	}
}

export { MattermostProvider };
