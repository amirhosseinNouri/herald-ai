import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  getReleaseManager,
  getProjectDetails,
  fetchVersionCommits,
} from '@/lib/gitlab';
import type { GitlabProject } from '@/types/gitlab';

const createMockResponse = (body: Record<string, unknown>, status = 200) =>
  ({
    ok: status === 200,
    status,
    json: async () => body,
  } as Response);

describe('lib => getProjectDetails', () => {
  let originalEnv: any;

  beforeEach(() => {
    originalEnv = { ...process.env };

    process.env.GITLAB_PROJECT_ID = 'test-project-id';
    process.env.GITLAB_BASE_URL = 'https://gitlab.example.com/api/v4';
    process.env.GITLAB_TOKEN = 'test-token';
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
  let originalEnv: any;

  beforeEach(() => {
    originalEnv = { ...process.env };

    process.env.GITLAB_TOKEN = 'test-token';
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
});

describe('lib => fetchVersionCommits', () => {
  let originalEnv: any;

  beforeEach(() => {
    originalEnv = { ...process.env };

    process.env.GITLAB_TOKEN = 'test-token';
  });

  afterEach(() => {
    process.env = originalEnv;

    if (global.fetch && (global.fetch as any).mockRestore) {
      (global.fetch as any).mockRestore();
    }
  });

  it('should throw an error if GITLAB_BASE_URL is not provided', () => {
    delete process.env.GITLAB_BASE_URL;
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

  //   TODO: implement test for all branches
});
