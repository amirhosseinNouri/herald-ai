import type { z } from "zod";
import type {
	gitlabCommitSchema,
	gitlabProjectSchema,
	gitlabTagSchema,
	gitlabUserSchema,
} from "@/schema/gitlab";

type Commit = z.infer<typeof gitlabCommitSchema>;

type GitlabTag = z.infer<typeof gitlabTagSchema>;

type GitlabUer = z.infer<typeof gitlabUserSchema>;

type GitlabProject = z.infer<typeof gitlabProjectSchema>;

export type { Commit, GitlabTag, GitlabUer, GitlabProject };
