/**
 * VCS Factory Tests
 * 
 * Tests the VCS factory as a complete authentication boundary following design principles:
 * - Single Authentication Boundary: All VCS authentication handled in factory
 * - No mocking of internal domain logic (authorization policy)
 * - Test complete authentication chain: authorize → getOctokit → provider creation
 */

import { Application } from 'probot';

import { RepoRef } from '../../src/core/signal/signal';
import { createVcsProvider } from '../../src/factories/vcs';
import { GitHubVcsProvider } from '../../src/providers/vcs/github';

// Mock GitHub provider to avoid Octokit ES module issues - this is external dependency
jest.mock('../../src/providers/vcs/github', () => ({
  GitHubVcsProvider: jest.fn().mockImplementation(() => ({
    mergeChange: jest.fn(),
    grantCollaborator: jest.fn(),
    revokeCollaborator: jest.fn()
  }))
}));

describe('VCS Factory', () => {
  let mockApp: jest.Mocked<Application>;
  let mockRepoRef: RepoRef;
  let mockAppOctokit: { request: jest.Mock };
  
  const testDao = '0x123abc';
  const testChainId = BigInt(1);

  beforeEach(() => {
    // Mock the GitHub API client with proper object-form request
    mockAppOctokit = {
      request: jest.fn().mockResolvedValue({
        data: { id: 12345 }
      })
    };

    // Mock Probot Application with proper auth chain
    mockApp = {
      auth: jest.fn()
        .mockResolvedValueOnce(mockAppOctokit) // First call returns app client
        .mockResolvedValueOnce({}) // Second call returns installation client
    } as unknown as jest.Mocked<Application>;

    mockRepoRef = {
      host: 'github.com',
      owner: 'owner',
      repo: 'repo',
      url: 'https://github.com/owner/repo'
    };

    jest.clearAllMocks();
  });

  describe('authentication boundary responsibility', () => {
    test('creates GitHub provider through complete auth chain', async () => {
      const provider = await createVcsProvider('github', mockApp, mockRepoRef, testDao, testChainId);

      // Verify factory handled all authentication concerns
      expect(provider).toBeDefined();
      expect(GitHubVcsProvider).toHaveBeenCalledWith(expect.anything());
      
      // Verify GitHub authentication flow with proper object-form request
      expect(mockApp.auth).toHaveBeenCalledTimes(2);
      expect(mockAppOctokit.request).toHaveBeenCalledWith({
        method: "GET",
        url: `/repos/${mockRepoRef.owner}/${mockRepoRef.repo}/installation`,
        headers: {},
      });
      expect(mockApp.auth).toHaveBeenLastCalledWith(12345);
    });

    test('handles authorization as part of factory responsibility', async () => {
      // Test factory's authorization integration (policy.ts returns true for MVP)
      const provider = await createVcsProvider('github', mockApp, mockRepoRef, testDao, testChainId);
      
      // Verify authorization didn't block factory operation
      expect(provider).toBeDefined();
      expect(provider).toHaveProperty('mergeChange');
      expect(provider).toHaveProperty('grantCollaborator');
      expect(provider).toHaveProperty('revokeCollaborator');
    });

    test('provider creation follows authentication order', async () => {
      await createVcsProvider('github', mockApp, mockRepoRef, testDao, testChainId);

      // Verify authentication happens before provider creation
      const authCalls = jest.mocked(mockApp.auth).mock.invocationCallOrder;
      const providerCreation = jest.mocked(GitHubVcsProvider).mock.invocationCallOrder[0];
      
      expect(authCalls[0]).toBeLessThan(providerCreation);
      expect(authCalls[1]).toBeLessThan(providerCreation);
    });
  });

  describe('VCS platform support', () => {
    test('supports GitHub with complete authentication', async () => {
      const provider = await createVcsProvider('github', mockApp, mockRepoRef, testDao, testChainId);
      
      // Verify VcsProvider interface
      expect(provider).toHaveProperty('mergeChange');
      expect(provider).toHaveProperty('grantCollaborator');
      expect(provider).toHaveProperty('revokeCollaborator');
    });

    test('rejects unsupported VCS platforms', async () => {
      await expect(
        createVcsProvider('bitbucket' as 'github', mockApp, mockRepoRef, testDao, testChainId)
      ).rejects.toThrow('Unsupported VCS: bitbucket');
    });

    test('rejects unimplemented GitLab', async () => {
      await expect(
        createVcsProvider('gitlab', mockApp, mockRepoRef, testDao, testChainId)
      ).rejects.toThrow('GitLab provider not implemented yet');
    });

    test('rejects unimplemented Radicle', async () => {
      await expect(
        createVcsProvider('radicle', mockApp, mockRepoRef, testDao, testChainId)
      ).rejects.toThrow('Radicle provider not implemented yet');
    });
  });

  describe('GitHub authentication integration', () => {
    test('handles GitHub App installation lookup', async () => {
      await createVcsProvider('github', mockApp, mockRepoRef, testDao, testChainId);

      // Verify proper GitHub API call with object-form request
      expect(mockAppOctokit.request).toHaveBeenCalledWith({
        method: "GET",
        url: `/repos/${mockRepoRef.owner}/${mockRepoRef.repo}/installation`,
        headers: {},
      });
    });

    test('handles GitHub App not installed error', async () => {
      const notFoundError = new Error('Not Found') as Error & { status: number };
      notFoundError.status = 404;
      mockAppOctokit.request.mockRejectedValueOnce(notFoundError);

      await expect(
        createVcsProvider('github', mockApp, mockRepoRef, testDao, testChainId)
      ).rejects.toThrow('GitHub App not installed on owner/repo');
    });

    test('handles complex repository paths', async () => {
      const complexRepoRef = {
        host: 'github.com',
        owner: 'org/subteam',
        repo: 'project',
        url: 'https://github.com/org/subteam/project'
      };

      await createVcsProvider('github', mockApp, complexRepoRef, testDao, testChainId);

      expect(mockAppOctokit.request).toHaveBeenCalledWith({
        method: "GET",
        url: `/repos/org/subteam/project/installation`,
        headers: {},
      });
    });

    test('handles authentication errors properly', async () => {
      const authError = new Error('Authentication failed');
      mockApp.auth.mockReset().mockRejectedValueOnce(authError);

      await expect(
        createVcsProvider('github', mockApp, mockRepoRef, testDao, testChainId)
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('factory interface contract', () => {
    test('requires all 5 parameters', async () => {
      // TypeScript should catch this at compile time, but verify runtime behavior
      const provider = await createVcsProvider('github', mockApp, mockRepoRef, testDao, testChainId);
      expect(provider).toBeDefined();
    });

    test('returns clean VcsProvider interface', async () => {
      const provider = await createVcsProvider('github', mockApp, mockRepoRef, testDao, testChainId);
      
      // Verify no underlying SDK clients are exposed
      expect(provider).not.toHaveProperty('octokit');
      expect(provider).not.toHaveProperty('auth');
      expect(provider).not.toHaveProperty('request');
      
      // Verify only VcsProvider interface methods are exposed
      expect(Object.keys(provider).sort()).toEqual(['grantCollaborator', 'mergeChange', 'revokeCollaborator']);
    });

    test('creates fresh provider instance per execution', async () => {
      // Reset mocks to ensure fresh auth calls for each provider
      jest.clearAllMocks();
      mockApp.auth
        .mockResolvedValueOnce(mockAppOctokit as unknown as ReturnType<Application['auth']>)
        .mockResolvedValueOnce({} as unknown as ReturnType<Application['auth']>)
        .mockResolvedValueOnce(mockAppOctokit as unknown as ReturnType<Application['auth']>) 
        .mockResolvedValueOnce({} as unknown as ReturnType<Application['auth']>);

      const provider1 = await createVcsProvider('github', mockApp, mockRepoRef, testDao, testChainId);
      const provider2 = await createVcsProvider('github', mockApp, mockRepoRef, testDao, testChainId);
      
      // Different instances
      expect(provider1).not.toBe(provider2);
      
      // Both fully functional
      expect(provider1).toHaveProperty('mergeChange');
      expect(provider2).toHaveProperty('mergeChange');
    });
  });
});