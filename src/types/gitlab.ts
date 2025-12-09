type Commit = {
  id: string;
  short_id: string;
  created_at: string;
  parent_ids: string[];
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committer_name: string;
  committer_email: string;
  committed_date: string;
  web_url: string;
};

type GitlabTag = {
  name: string;
  message: string;
  target: string;
  commit: Commit;
  release: null;
  protected: false;
  created_at: string;
};

type GitlabUer = {
  name: string;
};

type GitlabProject = {
  name: string;
};

export type { Commit, GitlabTag, GitlabUer, GitlabProject };
