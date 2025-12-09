import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  mock,
  spyOn,
} from 'bun:test';
import {
  getReleaseManager,
  getProjectDetails,
  fetchVersionCommits,
  getPreviousTag,
} from '@/lib/gitlab';
import type { Commit, GitlabProject, GitlabTag } from '@/types/gitlab';

const MOCK_BASE_API = 'https://gitlab.example.com/api/v4';
const MOCK_PROJECT_ID = 'test-project-id';
const MOCK_TOKEN = 'test-token';

const createMockResponse = <T>(body: T, status = 200) =>
  ({
    ok: status === 200,
    status,
    json: async () => body,
  } as Response);

describe('lib => getProjectDetails', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };

    process.env.GITLAB_PROJECT_ID = MOCK_PROJECT_ID;
    process.env.GITLAB_BASE_URL = MOCK_BASE_API;
    process.env.GITLAB_TOKEN = MOCK_TOKEN;
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;

    // Clean up fetch mock
    if (global.fetch && (global.fetch as any).mockRestore) {
      (global.fetch as any).mockRestore();
    }
  });

  it('should throw an error if GITLAB_PROJECT_ID is not provided', () => {
    delete process.env.GITLAB_PROJECT_ID;

    expect(() => getProjectDetails()).toThrowError(
      'GITLAB_PROJECT_ID not provided',
    );
  });

  it('should throw an error if GITLAB_BASE_URL is not provided', () => {
    delete process.env.GITLAB_BASE_URL;

    expect(() => getProjectDetails()).toThrowError(
      'GITLAB_BASE_URL not provided',
    );
  });

  it('should throw an error if GITLAB_TOKEN is not provided', () => {
    delete process.env.GITLAB_TOKEN;

    expect(() => getProjectDetails()).toThrowError('GITLAB_TOKEN not provided');
  });

  it('should get project details successfully', async () => {
    const mockProject: GitlabProject = {
      name: 'pwa',
    };

    const mockFetch = mock().mockResolvedValue(createMockResponse(mockProject));

    (global as any).fetch = mockFetch;

    const projectDetails = await getProjectDetails();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(projectDetails).toEqual({
      name: mockProject.name,
    });
  });

  it('should handle fetch errors', async () => {
    const mockFetch = mock().mockResolvedValue(
      createMockResponse({ error: 'Project not found' }, 404),
    );

    (global as any).fetch = mockFetch;

    await expect(getProjectDetails()).rejects.toThrow();
  });
});

describe('lib => getReleaseManager', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };

    process.env.GITLAB_TOKEN = MOCK_TOKEN;
  });

  afterEach(() => {
    process.env = originalEnv;

    if (global.fetch && (global.fetch as any).mockRestore) {
      (global.fetch as any).mockRestore();
    }
  });

  it('should throw an error if GITLAB_BASE_URL is not provided', () => {
    delete process.env.GITLAB_BASE_URL;

    expect(() => getReleaseManager()).toThrowError(
      'GITLAB_BASE_URL not provided',
    );
  });

  it('should throw an error if GITLAB_TOKEN is not provided', () => {
    delete process.env.GITLAB_TOKEN;

    expect(() => getReleaseManager()).toThrowError('GITLAB_TOKEN not provided');
  });

  it('should extract release manager successfully', async () => {
    const mockFetch = mock().mockResolvedValue(
      createMockResponse({ name: 'John Doe' }),
    );

    (global as any).fetch = mockFetch;

    const releaseManager = await getReleaseManager();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(releaseManager).toEqual('John Doe');
  });

  it('should handle fetch errors', async () => {
    const mockFetch = mock().mockResolvedValue(
      createMockResponse({ error: 'User not found' }, 404),
    );

    (global as any).fetch = mockFetch;

    await expect(getReleaseManager()).rejects.toThrow();
  });

  it('should throw an error getting error from Gitlab', async () => {
    const error = { message: 'Internal server error' };
    const mockFetch = mock().mockResolvedValue(error);
    (global as any).fetch = mockFetch;

    await expect(() => getReleaseManager()).toThrowError(error.message);
  });
});

describe('lib => fetchVersionCommits', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };

    process.env.GITLAB_BASE_URL = MOCK_BASE_API;
    process.env.GITLAB_PROJECT_ID = MOCK_PROJECT_ID;
    process.env.GITLAB_TOKEN = MOCK_TOKEN;
  });

  afterEach(() => {
    process.env = originalEnv;

    if (global.fetch && (global.fetch as any).mockRestore) {
      (global.fetch as any).mockRestore();
    }
  });

  it('should throw an error if GITLAB_BASE_URL is not provided', () => {
    delete process.env.GITLAB_BASE_URL;

    expect(() => fetchVersionCommits('1.0.0')).toThrowError(
      'GITLAB_BASE_URL not provided',
    );
  });

  it('should throw an error if GITLAB_PROJECT_ID is not provided', () => {
    delete process.env.GITLAB_PROJECT_ID;

    expect(() => fetchVersionCommits('1.0.0')).toThrowError(
      'GITLAB_PROJECT_ID not provided',
    );
  });

  it('should throw an error if GITLAB_TOKEN is not provided', () => {
    delete process.env.GITLAB_TOKEN;

    expect(() => fetchVersionCommits('1.0.0')).toThrowError(
      'GITLAB_TOKEN not provided',
    );
  });

  it('should fetch version commits successfully', async () => {
    const mockCommits: Commit[] = [
      {
        id: '123',
        title: 'Test commit',
        message: 'Test commit',
      },
    ];

    const mockTag: GitlabTag = {
      name: 'v0.9.0',
      message: '',
      commit: {
        id: 'abc123',
        title: '',
        message: '',
      },
    };

    const getPreviousTagSpy = spyOn(
      await import('@/lib/gitlab'),
      'getPreviousTag',
    ).mockResolvedValue(mockTag);

    // Mock fetch only for the compare API call
    const mockFetch = mock().mockResolvedValue(
      createMockResponse({ commits: mockCommits }),
    );
    (global as any).fetch = mockFetch;

    const commits = await fetchVersionCommits('v1.0.0');

    expect(getPreviousTagSpy).toHaveBeenCalledWith('v1.0.0');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(commits).toEqual(mockCommits);

    getPreviousTagSpy.mockRestore();
  });

  it('should handle getPreviousTag errors', async () => {
    const getPreviousTagSpy = spyOn(
      await import('@/lib/gitlab'),
      'getPreviousTag',
    ).mockRejectedValue(new Error('Previous tag not found.'));

    await expect(fetchVersionCommits('v1.0.0')).rejects.toThrow(
      'Previous tag not found.',
    );

    expect(getPreviousTagSpy).toHaveBeenCalledWith('v1.0.0');

    getPreviousTagSpy.mockRestore();
  });

  it('should throw an error getting error from Gitlab', async () => {
    const error = { message: 'Internal server error' };
    const mockFetch = mock().mockResolvedValue(error);
    (global as any).fetch = mockFetch;

    await expect(() => fetchVersionCommits('v1.0.0')).toThrowError(
      error.message,
    );
  });
});

describe('lib => getPreviousTag', async () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };

    process.env.GITLAB_BASE_URL = MOCK_BASE_API;
    process.env.GITLAB_PROJECT_ID = MOCK_PROJECT_ID;
    process.env.GITLAB_TOKEN = MOCK_TOKEN;
  });

  afterEach(() => {
    process.env = originalEnv;

    if (global.fetch && (global.fetch as any).mockRestore) {
      (global.fetch as any).mockRestore();
    }
  });

  it('should throw an error if GITLAB_BASE_URL is not provided', () => {
    delete process.env.GITLAB_BASE_URL;

    expect(() => getPreviousTag('v1.0.0')).toThrowError(
      'GITLAB_BASE_URL not provided',
    );
  });

  it('should throw an error if GITLAB_PROJECT_ID is not provided', () => {
    delete process.env.GITLAB_PROJECT_ID;

    expect(() => getPreviousTag('v1.0.0')).toThrowError(
      'GITLAB_PROJECT_ID not provided',
    );
  });

  it('should throw an error if GITLAB_TOKEN is not provided', () => {
    delete process.env.GITLAB_TOKEN;

    expect(() => getPreviousTag('v1.0.0')).toThrowError(
      'GITLAB_TOKEN not provided',
    );
  });

  it('should get previous tag successfully', async () => {
    const tag1: GitlabTag = {
      name: 'v1.1.0',
      message: '',
      commit: {
        id: 'abc123',
        title: '',
        message: '',
      },
    };

    const tag2: GitlabTag = {
      name: 'v1.1.1',
      message: '',
      commit: {
        id: 'abc123',
        title: '',
        message: '',
      },
    };
    const mockTags: GitlabTag[] = [tag2, tag1];

    const mockFetch = mock().mockResolvedValue(createMockResponse(mockTags));

    (global as any).fetch = mockFetch;

    const previousTag = await getPreviousTag('v1.1.1');
    expect(previousTag).toEqual(tag1);
  });

  it('should throw an error if version tag is not found', async () => {
    const tag: GitlabTag = {
      name: 'v1.1.0',
      message: '',
      commit: {
        id: 'abc123',
        title: '',
        message: '',
      },
    };

    const mockTags: GitlabTag[] = [tag];

    const mockFetch = mock().mockResolvedValue(createMockResponse(mockTags));

    (global as any).fetch = mockFetch;

    await expect(() => getPreviousTag('v1.1.1')).toThrowError();
  });

  it('should throw an error if previous tag is not found', async () => {
    const tag1: GitlabTag = {
      name: 'v1.1.0',
      message: '',
      commit: {
        id: 'abc123',
        title: '',
        message: '',
      },
    };
    const mockTags: GitlabTag[] = [tag1];

    const mockFetch = mock().mockResolvedValue(createMockResponse(mockTags));

    (global as any).fetch = mockFetch;

    await expect(() => getPreviousTag('v1.1.1')).toThrowError();
  });

  it('should throw an error getting error from Gitlab', async () => {
    const error = { message: 'Internal server error' };
    const mockFetch = mock().mockResolvedValue(error);
    (global as any).fetch = mockFetch;

    await expect(() => getPreviousTag('v1.1.1')).toThrowError(error.message);
  });
});
