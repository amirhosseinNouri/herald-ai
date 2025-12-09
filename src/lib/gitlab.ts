import {
	gitlabCompareResponseSchema,
	gitlabProjectSchema,
	gitlabTagsResponseSchema,
	gitlabUserSchema,
} from "@/schema/gitlab";
import { isError } from "@/types/error";
import type { Commit, GitlabTag } from "@/types/gitlab";

const PAGE_SIZE = 100;

const getPreviousTag = async (version: string) => {
	const { GITLAB_BASE_URL, GITLAB_PROJECT_ID, GITLAB_TOKEN } = process.env;

	if (!GITLAB_BASE_URL) {
		throw new Error("GITLAB_BASE_URL not provided");
	}

	if (!GITLAB_PROJECT_ID) {
		throw new Error("GITLAB_PROJECT_ID not provided");
	}

	if (!GITLAB_TOKEN) {
		throw new Error("GITLAB_TOKEN not provided");
	}

	// TODO: It is better to recursively fetch tags until we find the previous tag
	const response = await fetch(
		`${GITLAB_BASE_URL}/projects/${GITLAB_PROJECT_ID}/repository/tags?per_page=${PAGE_SIZE}`,
		{
			headers: {
				Authorization: `Bearer ${GITLAB_TOKEN}`,
			},
		},
	);

	if (isError(response)) {
		throw new Error(response.message);
	}

	const data = await response.json();
	const tags = gitlabTagsResponseSchema.parse(data);
	const semanticTags = tags.filter((tag) => tag.name.match(/^v\d+\.\d+\.\d+$/));

	const tagIndex = semanticTags.findIndex(
		(tag: GitlabTag) => tag.name === version,
	);

	if (tagIndex === -1) {
		throw new Error(`Version ${version} not found.`);
	}

	const previousTag = semanticTags[tagIndex + 1];

	if (!previousTag) {
		throw new Error("Previous tag not found.");
	}

	return previousTag;
};

const fetchVersionCommits = async (version: string): Promise<Commit[]> => {
	const { GITLAB_BASE_URL, GITLAB_PROJECT_ID, GITLAB_TOKEN } = process.env;

	if (!GITLAB_BASE_URL) {
		throw new Error("GITLAB_BASE_URL not provided");
	}

	if (!GITLAB_PROJECT_ID) {
		throw new Error("GITLAB_PROJECT_ID not provided");
	}

	if (!GITLAB_TOKEN) {
		throw new Error("GITLAB_TOKEN not provided");
	}

	const previousTag = await getPreviousTag(version);

	const response = await fetch(
		`${GITLAB_BASE_URL}/projects/${GITLAB_PROJECT_ID}/repository/compare?from=${previousTag.name}&to=${version}&per_page=100`,
		{
			headers: {
				Authorization: `Bearer ${GITLAB_TOKEN}`,
			},
		},
	);

	if (isError(response)) {
		throw new Error(response.message);
	}

	const data = await response.json();

	const { commits } = gitlabCompareResponseSchema.parse(data);

	const commitsWithoutTags = commits.filter(
		(commit: Commit) => !commit.title.match(/^\d+\.\d+\.\d+(-\S+)?$/),
	);

	return commitsWithoutTags;
};

const getReleaseManager = async () => {
	const { GITLAB_BASE_URL, GITLAB_TOKEN } = process.env;

	if (!GITLAB_BASE_URL) {
		throw new Error("GITLAB_BASE_URL not provided");
	}

	if (!GITLAB_TOKEN) {
		throw new Error("GITLAB_TOKEN not provided");
	}

	const response = await fetch(`${GITLAB_BASE_URL}/user`, {
		headers: {
			Authorization: `Bearer ${GITLAB_TOKEN}`,
		},
	});

	if (isError(response)) {
		throw new Error(response.message);
	}

	const data = await response.json();
	const user = gitlabUserSchema.parse(data);
	return user.name;
};

const getProjectDetails = async () => {
	const { GITLAB_BASE_URL, GITLAB_PROJECT_ID, GITLAB_TOKEN } = process.env;

	if (!GITLAB_PROJECT_ID) {
		throw new Error("GITLAB_PROJECT_ID not provided");
	}

	if (!GITLAB_BASE_URL) {
		throw new Error("GITLAB_BASE_URL not provided");
	}

	if (!GITLAB_TOKEN) {
		throw new Error("GITLAB_TOKEN not provided");
	}

	const response = await fetch(
		`${GITLAB_BASE_URL}/projects/${GITLAB_PROJECT_ID}`,
		{
			headers: {
				Authorization: `Bearer ${GITLAB_TOKEN}`,
			},
		},
	);

	if (isError(response)) {
		throw new Error(response.message);
	}

	const project = await response.json();
	return gitlabProjectSchema.parse(project);
};

export {
	fetchVersionCommits,
	getReleaseManager,
	getProjectDetails,
	getPreviousTag,
};
