import { z } from "zod";

const gitlabProjectSchema = z.object({
	name: z.string(),
});

const gitlabCommitSchema = z.object({
	id: z.string(),
	title: z.string(),
	message: z.string(),
});

const gitlabTagSchema = z.object({
	name: z.string(),
	message: z.string(),
	commit: gitlabCommitSchema,
});

const gitlabUserSchema = z.object({
	name: z.string(),
});

const gitlabTagsResponseSchema = z.array(gitlabTagSchema);

const gitlabCompareResponseSchema = z.object({
	commits: z.array(gitlabCommitSchema),
});

export {
	gitlabProjectSchema,
	gitlabTagSchema,
	gitlabCommitSchema,
	gitlabTagsResponseSchema,
	gitlabCompareResponseSchema,
	gitlabUserSchema,
};
