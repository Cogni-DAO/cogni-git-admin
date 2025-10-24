/**
 * GitHub VCS Provider Tests
 * 
 * Tests for the GitHub VCS provider implementation
 */

import { Octokit } from 'octokit';

import { GrantCollaboratorParams, MergeChangeParams, RevokeCollaboratorParams } from '../../src/core/action_execution/types';
import { GitHubVcsProvider } from '../../src/providers/vcs/github';
import { RepoRef } from '../../src/providers/vcs/types';
import * as githubService from '../../src/services/github';

// Mock the GitHub service functions
jest.mock('../../src/services/github');
const mockGithubService = githubService as jest.Mocked<typeof githubService>;

describe('GitHubVcsProvider', () => {
  let provider: GitHubVcsProvider;
  let mockOctokit: jest.Mocked<Octokit>;
  let mockRepoRef: RepoRef;

  beforeEach(() => {
    mockOctokit = {} as jest.Mocked<Octokit>;
    provider = new GitHubVcsProvider(mockOctokit);
    mockRepoRef = {
      host: 'github.com',
      owner: 'derekg1729',
      repo: 'test-repo',
      url: 'https://github.com/derekg1729/test-repo'
    };
    jest.clearAllMocks();
  });

  describe('mergeChange', () => {
    test('successful merge returns success result', async () => {
      const mockServiceResult = {
        success: true,
        sha: 'abc123',
        merged: true,
        message: 'Merge successful',
        status: 200
      };
      mockGithubService.mergePR.mockResolvedValue(mockServiceResult);

      const params: MergeChangeParams = { mergeMethod: 'merge' };
      const result = await provider.mergeChange(mockRepoRef, 123, params);

      expect(result.success).toBe(true);
      expect(result.sha).toBe('abc123');
      expect(result.merged).toBe(true);
      expect(result.message).toBe('Merge successful');
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(200);
      expect(mockGithubService.mergePR).toHaveBeenCalledWith(
        mockOctokit,
        'derekg1729/test-repo',
        123,
        params
      );
    });

    test('failed merge returns error result', async () => {
      const mockServiceResult = {
        success: false,
        error: 'PR already merged',
        status: 422
      };
      mockGithubService.mergePR.mockResolvedValue(mockServiceResult);

      const params: MergeChangeParams = {};
      const result = await provider.mergeChange(mockRepoRef, 123, params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('PR already merged');
      expect(result.status).toBe(422);
    });

    test('handles thrown exceptions', async () => {
      mockGithubService.mergePR.mockRejectedValue(new Error('Network error'));

      const params: MergeChangeParams = {};
      const result = await provider.mergeChange(mockRepoRef, 123, params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('grantCollaborator', () => {
    test('successful grant returns success result', async () => {
      const mockServiceResult = {
        success: true,
        username: 'newuser',
        permission: 'admin' as const,
        status: 201
      };
      mockGithubService.addAdmin.mockResolvedValue(mockServiceResult);

      const params: GrantCollaboratorParams = { permission: 'admin' };
      const result = await provider.grantCollaborator(mockRepoRef, 'newuser', params);

      expect(result.success).toBe(true);
      expect(result.username).toBe('newuser');
      expect(result.permission).toBe('admin');
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(201);
      expect(mockGithubService.addAdmin).toHaveBeenCalledWith(
        mockOctokit,
        'derekg1729/test-repo',
        'newuser',
        'admin'
      );
    });

    test('failed grant returns error result', async () => {
      const mockServiceResult = {
        success: false,
        error: 'User not found',
        status: 404
      };
      mockGithubService.addAdmin.mockResolvedValue(mockServiceResult);

      const params: GrantCollaboratorParams = {};
      const result = await provider.grantCollaborator(mockRepoRef, 'nonexistent', params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
      expect(result.status).toBe(404);
    });
  });

  describe('revokeCollaborator', () => {
    test('successful remove returns success result', async () => {
      const mockRemoveResult = {
        success: true,
        username: 'olduser',
        status: 204
      };
      const mockListResult = {
        success: true,
        invitations: [],
        status: 200
      };
      
      mockGithubService.removeCollaborator.mockResolvedValue(mockRemoveResult);
      mockGithubService.listInvitations.mockResolvedValue(mockListResult);

      const params: RevokeCollaboratorParams = {};
      const result = await provider.revokeCollaborator(mockRepoRef, 'olduser', params);

      expect(result.success).toBe(true);
      expect(result.username).toBe('olduser');
      expect(result.operation).toBe('collaborator_removed');
      expect(result.status).toBe(204);
    });

    test('handles invitation cancellation when collaborator removal fails', async () => {
      const mockRemoveResult = {
        success: true,
        username: 'pendinguser',
        status: 204
      };
      const mockListResult = {
        success: true,
        invitations: [
          { id: 123, invitee: { login: 'pendinguser' } }
        ],
        status: 200
      };
      const mockCancelResult = {
        success: true,
        invitationId: 123,
        status: 204
      };

      mockGithubService.removeCollaborator.mockResolvedValue(mockRemoveResult);
      mockGithubService.listInvitations.mockResolvedValue(mockListResult);
      mockGithubService.cancelInvitation.mockResolvedValue(mockCancelResult);

      const params: RevokeCollaboratorParams = {};
      const result = await provider.revokeCollaborator(mockRepoRef, 'pendinguser', params);

      expect(result.success).toBe(true);
      expect(result.username).toBe('pendinguser');
      expect(result.invitationId).toBe(123);
      expect(result.operation).toBe('invitation_cancelled');
    });
  });
});