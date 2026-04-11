import type {
	AnnouncementPayload,
	AnnouncementProvider,
} from "@/types/provider";

interface GitlabReleaseProviderConfig {
	type: "gitlab-release";
	baseUrl: string;
	token: string;
	projectId: string;
}

class GitlabReleaseProvider implements AnnouncementProvider {
	name = "GitLab Release";
	private baseUrl: string;
	private token: string;
	private projectId: string;

	constructor(config: GitlabReleaseProviderConfig) {
		this.baseUrl = config.baseUrl;
		this.token = config.token;
		this.projectId = config.projectId;
	}

	async announce(payload: AnnouncementPayload): Promise<void> {
		const url = `${this.baseUrl}/projects/${this.projectId}/releases`;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.token}`,
			},
			body: JSON.stringify({
				tag_name: payload.tag,
				name: `${payload.projectName} ${payload.tag}`,
				description: payload.changelog,
			}),
		});

		if (!response.ok) {
			const body = await response.text();
			throw new Error(
				`GitLab release creation failed (${response.status}): ${body}`,
			);
		}
	}
}

export { GitlabReleaseProvider };
