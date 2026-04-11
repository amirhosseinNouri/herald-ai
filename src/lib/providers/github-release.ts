import type {
	AnnouncementPayload,
	AnnouncementProvider,
} from "@/types/provider";

interface GithubReleaseProviderConfig {
	type: "github-release";
	token: string;
	owner: string;
	repo: string;
}

class GithubReleaseProvider implements AnnouncementProvider {
	name = "GitHub Release";
	private token: string;
	private owner: string;
	private repo: string;

	constructor(config: GithubReleaseProviderConfig) {
		this.token = config.token;
		this.owner = config.owner;
		this.repo = config.repo;
	}

	async announce(payload: AnnouncementPayload): Promise<void> {
		const url = `https://api.github.com/repos/${this.owner}/${this.repo}/releases`;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/vnd.github+json",
				Authorization: `Bearer ${this.token}`,
				"X-GitHub-Api-Version": "2022-11-28",
			},
			body: JSON.stringify({
				tag_name: payload.tag,
				name: `${payload.projectName} ${payload.tag}`,
				body: payload.changelog,
			}),
		});

		if (!response.ok) {
			const body = await response.text();
			throw new Error(
				`GitHub release creation failed (${response.status}): ${body}`,
			);
		}
	}
}

export { GithubReleaseProvider };
