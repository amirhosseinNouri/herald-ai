import type {
	AnnouncementPayload,
	AnnouncementProvider,
} from "@/types/provider";

interface SlackBlock {
	type: string;
	text?: { type: string; text: string };
	fields?: Array<{ type: string; text: string }>;
}

interface SlackMessage {
	text: string;
	blocks: SlackBlock[];
}

interface SlackProviderConfig {
	type: "slack";
	webhookUrl: string;
}

class SlackProvider implements AnnouncementProvider {
	name = "Slack";
	private webhookUrl: string;

	constructor(config: SlackProviderConfig) {
		this.webhookUrl = config.webhookUrl;
	}

	async announce(payload: AnnouncementPayload): Promise<void> {
		const summary = `${payload.projectName} ${payload.tag} Released`;

		const message: SlackMessage = {
			text: summary,
			blocks: [
				{
					type: "header",
					text: { type: "plain_text", text: summary },
				},
				{
					type: "section",
					fields: [
						{
							type: "mrkdwn",
							text: `*Project:*\n${payload.projectName}`,
						},
						{ type: "mrkdwn", text: `*Version:*\n${payload.tag}` },
						{
							type: "mrkdwn",
							text: `*Release Manager:*\n${payload.releaseManager}`,
						},
					],
				},
				{ type: "divider" },
				{
					type: "section",
					text: { type: "mrkdwn", text: payload.changelog },
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
				`Slack webhook returned status ${response.status}: ${body}`,
			);
		}
	}
}

export { SlackProvider };
