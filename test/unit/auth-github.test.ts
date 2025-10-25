/**
 * GitHub Authentication Tests
 * 
 * Tests the GitHub authentication system for creating authenticated Octokit clients
 * with automatic installation ID resolution.
 */

import { Application } from 'probot';

import { getOctokit } from '../../src/core/auth/github';
import { RepoRef } from '../../src/core/signal/signal';

describe('GitHub Authentication', () => {
  let mockApp: jest.Mocked<Application>;
  let mockAppOctokit: { request: jest.Mock };
  let mockInstallationOctokit: Record<string, unknown>;
  let testRepoRef: RepoRef;

  beforeEach(() => {
    // Mock GitHub API client
    mockAppOctokit = {
      request: jest.fn().mockResolvedValue({
        data: { id: 12345 }
      })
    };

    mockInstallationOctokit = {
      rest: { apps: {}, repos: {} },
      request: jest.fn()
    };

    // Mock Probot Application
    mockApp = {
      auth: jest.fn()
        .mockResolvedValueOnce(mockAppOctokit) // First call returns app client
        .mockResolvedValueOnce(mockInstallationOctokit) // Second call returns installation client
    } as unknown as jest.Mocked<Application>;

    testRepoRef = {
      host: 'github.com',
      owner: 'owner',
      repo: 'repo',
      url: 'https://github.com/owner/repo'
    };

    jest.clearAllMocks();
  });

  describe('Octokit client creation', () => {
    test('creates authenticated installation client', async () => {
      const octokit = await getOctokit(mockApp, testRepoRef);

      expect(octokit).toBe(mockInstallationOctokit);
      expect(mockApp.auth).toHaveBeenCalledTimes(2);
      expect(mockApp.auth).toHaveBeenNthCalledWith(1); // App auth
      expect(mockApp.auth).toHaveBeenNthCalledWith(2, 12345); // Installation auth
    });

    test('looks up installation via repository API', async () => {
      await getOctokit(mockApp, testRepoRef);

      expect(mockAppOctokit.request).toHaveBeenCalledWith({
        method: "GET",
        url: `/repos/${testRepoRef.owner}/${testRepoRef.repo}/installation`,
        headers: {},
      });
    });

    test('handles complex repository paths', async () => {
      const complexRepoRef = {
        host: 'github.com',
        owner: 'org/subteam',
        repo: 'project',
        url: 'https://github.com/org/subteam/project'
      };

      await getOctokit(mockApp, complexRepoRef);

      expect(mockAppOctokit.request).toHaveBeenCalledWith({
        method: "GET",
        url: `/repos/org/subteam/project/installation`,
        headers: {},
      });
    });
  });

  describe('error handling', () => {
    test('handles GitHub App not installed error', async () => {
      const notFoundError = new Error('Not Found') as Error & { status: number };
      notFoundError.status = 404;
      mockAppOctokit.request.mockRejectedValueOnce(notFoundError);

      await expect(getOctokit(mockApp, testRepoRef)).rejects.toThrow(
        'GitHub App not installed on owner/repo'
      );
    });

    test('handles App authentication failure', async () => {
      const authError = new Error('Authentication failed');
      mockApp.auth.mockReset().mockRejectedValueOnce(authError);

      await expect(getOctokit(mockApp, testRepoRef)).rejects.toThrow(
        'Authentication failed'
      );
    });

    test('handles installation lookup API errors', async () => {
      const apiError = new Error('API Error') as Error & { status: number };
      apiError.status = 500;
      mockAppOctokit.request.mockRejectedValueOnce(apiError);

      await expect(getOctokit(mockApp, testRepoRef)).rejects.toThrow('API Error');
    });

    test('handles installation authentication failure', async () => {
      const installationAuthError = new Error('Installation auth failed');
      
      // Reset and configure auth mock for this specific test
      mockApp.auth = jest.fn()
        .mockResolvedValueOnce(mockAppOctokit as unknown as ReturnType<Application['auth']>) // App auth succeeds
        .mockRejectedValueOnce(installationAuthError); // Installation auth fails

      await expect(getOctokit(mockApp, testRepoRef)).rejects.toThrow(
        'Installation auth failed'
      );
    });

    test('preserves error properties for non-404 errors', async () => {
      const customError = new Error('Custom error') as Error & { 
        status: number; 
        customProperty: string;
      };
      customError.status = 403;
      customError.customProperty = 'test';
      mockAppOctokit.request.mockRejectedValueOnce(customError);

      await expect(getOctokit(mockApp, testRepoRef)).rejects.toMatchObject({
        message: 'Custom error',
        status: 403,
        customProperty: 'test'
      });
    });
  });

  describe('authentication flow', () => {
    test('follows correct authentication sequence', async () => {
      await getOctokit(mockApp, testRepoRef);

      // Verify authentication happens before installation lookup
      const authCalls = jest.mocked(mockApp.auth).mock.invocationCallOrder;
      const requestCall = mockAppOctokit.request.mock.invocationCallOrder[0];
      
      expect(authCalls[0]).toBeLessThan(requestCall);
      expect(authCalls[1]).toBeGreaterThan(requestCall);
    });

    test('uses installation ID from API response', async () => {
      mockAppOctokit.request.mockResolvedValueOnce({
        data: { id: 98765 }
      });

      await getOctokit(mockApp, testRepoRef);

      expect(mockApp.auth).toHaveBeenLastCalledWith(98765);
    });

    test('creates fresh authentication per call', async () => {
      // Reset mocks for fresh calls
      jest.clearAllMocks();
      mockApp.auth
        .mockResolvedValueOnce(mockAppOctokit as unknown as ReturnType<Application['auth']>)
        .mockResolvedValueOnce({} as unknown as ReturnType<Application['auth']>)
        .mockResolvedValueOnce(mockAppOctokit as unknown as ReturnType<Application['auth']>)
        .mockResolvedValueOnce({} as unknown as ReturnType<Application['auth']>);

      const octokit1 = await getOctokit(mockApp, testRepoRef);
      const octokit2 = await getOctokit(mockApp, testRepoRef);

      // Different client instances
      expect(octokit1).not.toBe(octokit2);
      
      // Fresh authentication calls for each
      expect(mockApp.auth).toHaveBeenCalledTimes(4);
    });
  });
});