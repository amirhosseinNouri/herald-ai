import type {
	AnnouncementPayload,
	AnnouncementProvider,
} from "@/types/provider";

interface TelegramProviderConfig {
	type: "telegram";
	botToken: string;
	chatId: string;
}

class TelegramProvider implements AnnouncementProvider {
	name = "Telegram";
	private botToken: string;
	private chatId: string;

	constructor(config: TelegramProviderConfig) {
		this.botToken = config.botToken;
		this.chatId = config.chatId;
	}

	async announce(payload: AnnouncementPayload): Promise<void> {
		const text = [
			`*${payload.projectName} ${payload.tag} Released*`,
			"",
			`*Release Manager:* ${payload.releaseManager}`,
			"",
			payload.changelog,
		].join("\n");

		const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				chat_id: this.chatId,
				text,
				parse_mode: "Markdown",
			}),
		});

		if (!response.ok) {
			const body = await response.text();
			throw new Error(
				`Telegram API returned status ${response.status}: ${body}`,
			);
		}
	}
}

export { TelegramProvider };
