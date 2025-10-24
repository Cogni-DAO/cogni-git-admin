/**
 * VCS Factory Tests
 * 
 * Tests for the VCS provider factory function
 */

import { Application } from 'probot';

import * as githubAuth from '../../src/core/auth/github';
import { RepoRef } from '../../src/core/signal/signal';
import { createVcsProvider } from '../../src/factories/vcs';
import { GitHubVcsProvider } from '../../src/providers/vcs/github';

// Mock GitHub auth module
jest.mock('../../src/core/auth/github', () => ({
  getInstallationId: jest.fn()
}));

// Mock GitHub provider to avoid Octokit ES module issues
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
  const mockDao = '0x123abc';

  beforeEach(() => {
    mockApp = {
      auth: jest.fn().mockResolvedValue({})
    } as jest.Mocked<Partial<Application>>;

    mockRepoRef = {
      host: 'github.com',
      owner: 'owner',
      repo: 'repo',
      url: 'https://github.com/owner/repo'
    };

    (githubAuth.getInstallationId as jest.Mock).mockReturnValue(12345);
    jest.clearAllMocks();
  });

  describe('createVcsProvider', () => {
    test('creates GitHub provider for github VCS type', async () => {
      const provider = await createVcsProvider('github', mockApp, mockRepoRef, mockDao);

      expect(provider).toBeDefined();
      expect(GitHubVcsProvider).toHaveBeenCalledWith(expect.anything());
      expect(githubAuth.getInstallationId).toHaveBeenCalledWith(mockDao, 'owner/repo');
      expect(mockApp.auth).toHaveBeenCalledWith(12345);
    });

    test('throws error for unsupported VCS type', async () => {
      await expect(
        createVcsProvider('bitbucket' as 'github', mockApp, mockRepoRef, mockDao)
      ).rejects.toThrow('Unsupported VCS: bitbucket');
    });

    test('throws error for unimplemented GitLab', async () => {
      await expect(
        createVcsProvider('gitlab', mockApp, mockRepoRef, mockDao)
      ).rejects.toThrow('GitLab provider not implemented yet');
    });

    test('throws error for unimplemented Radicle', async () => {
      await expect(
        createVcsProvider('radicle', mockApp, mockRepoRef, mockDao)
      ).rejects.toThrow('Radicle provider not implemented yet');
    });
  });

  describe('supported VCS types', () => {
    test('supports github', async () => {
      const provider = await createVcsProvider('github', mockApp, mockRepoRef, mockDao);
      expect(provider).toBeDefined();
    });

    test('github provider has correct interface', async () => {
      const provider = await createVcsProvider('github', mockApp, mockRepoRef, mockDao);
      
      expect(provider).toHaveProperty('mergeChange');
      expect(provider).toHaveProperty('grantCollaborator');
      expect(provider).toHaveProperty('revokeCollaborator');
    });
  });

  describe('authentication integration', () => {
    test('uses correct installation ID for authentication', async () => {
      (githubAuth.getInstallationId as jest.Mock).mockReturnValue(98765);

      await createVcsProvider('github', mockApp, mockRepoRef, mockDao);

      expect(githubAuth.getInstallationId).toHaveBeenCalledWith(mockDao, 'owner/repo');
      expect(mockApp.auth).toHaveBeenCalledWith(98765);
    });

    test('handles GitLab subgroups correctly', async () => {
      const subgroupRepoRef = {
        host: 'github.com',
        owner: 'org/subteam',
        repo: 'project',
        url: 'https://github.com/org/subteam/project'
      };

      await createVcsProvider('github', mockApp, subgroupRepoRef, mockDao);

      expect(githubAuth.getInstallationId).toHaveBeenCalledWith(mockDao, 'org/subteam/project');
    });
  });
});