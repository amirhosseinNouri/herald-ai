import type {
	AnnouncementPayload,
	AnnouncementProvider,
} from "@/types/provider";

interface ElementProviderConfig {
	type: "element";
	homeserverUrl: string;
	accessToken: string;
	roomId: string;
}

class ElementProvider implements AnnouncementProvider {
	name = "Element";
	private homeserverUrl: string;
	private accessToken: string;
	private roomId: string;

	constructor(config: ElementProviderConfig) {
		this.homeserverUrl = config.homeserverUrl;
		this.accessToken = config.accessToken;
		this.roomId = config.roomId;
	}

	async announce(payload: AnnouncementPayload): Promise<void> {
		const body = [
			`**${payload.projectName} ${payload.tag} Released**`,
			"",
			`**Release Manager:** ${payload.releaseManager}`,
			"",
			payload.changelog,
		].join("\n");

		const txnId = `herald-${Date.now()}`;
		const encodedRoomId = encodeURIComponent(this.roomId);
		const url = `${this.homeserverUrl}/_matrix/client/v3/rooms/${encodedRoomId}/send/m.room.message/${txnId}`;

		let response: Response;
		try {
			response = await fetch(url, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.accessToken}`,
				},
				body: JSON.stringify({
					msgtype: "m.text",
					body,
					format: "org.matrix.custom.html",
					formatted_body: body.replace(/\n/g, "<br>"),
				}),
			});
		} catch (error) {
			const cause =
				error instanceof Error ? (error.cause ?? error.message) : error;
			throw new Error(`Element fetch failed: ${JSON.stringify(cause)}`);
		}

		if (!response.ok) {
			const responseBody = await response.text();
			throw new Error(
				`Element API returned status ${response.status}: ${responseBody}`,
			);
		}
	}
}

export { ElementProvider };
