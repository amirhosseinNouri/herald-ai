import { z } from 'zod';

const gitlabProjectSchema = z.object({
  name: z.string(),
});

const gitlabCommitSchema = z.object({
  id: z.string(),
  short_id: z.string(),
  created_at: z.string(),
  parent_ids: z.array(z.string()),
  title: z.string(),
  message: z.string(),
  author_name: z.string(),
  author_email: z.string(),
});

const gitlabTagSchema = z.object({
  name: z.string(),
  message: z.string(),
  target: z.string(),
  commit: gitlabCommitSchema,
  protected: z.boolean(),
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
