/**
 * GitHub VCS Provider Tests
 * 
 * Tests for the GitHub VCS provider implementation
 */

import { GitHubVcsProvider } from '../../src/providers/vcs/github'
import { RepoRef } from '../../src/providers/vcs/types'
import * as githubService from '../../src/services/github'

// Mock the GitHub service functions
jest.mock('../../src/services/github')
const mockGithubService = githubService as jest.Mocked<typeof githubService>

// Mock Octokit
jest.mock('octokit', () => ({
  Octokit: jest.fn().mockImplementation(() => ({}))
}))

describe('GitHubVcsProvider', () => {
  let provider: GitHubVcsProvider
  let mockRepoRef: RepoRef

  beforeEach(() => {
    provider = new GitHubVcsProvider()
    mockRepoRef = {
      host: 'github.com',
      owner: 'derekg1729',
      repo: 'test-repo',
      url: 'https://github.com/derekg1729/test-repo'
    }
    jest.clearAllMocks()
  })

  describe('provider properties', () => {
    test('has correct name and host', () => {
      expect(provider.name).toBe('github')
      expect(provider.host).toBe('github.com')
    })
  })

  describe('mergePR', () => {
    test('successful merge returns success result', async () => {
      const mockServiceResult = {
        success: true,
        sha: 'abc123',
        merged: true,
        message: 'Merge successful'
      }
      mockGithubService.mergePR.mockResolvedValue(mockServiceResult)

      const result = await provider.mergePR(mockRepoRef, 123, 'executor', 'token')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        sha: 'abc123',
        merged: true,
        message: 'Merge successful'
      })
      expect(result.error).toBeUndefined()
      expect(mockGithubService.mergePR).toHaveBeenCalledWith(
        expect.any(Object), // Octokit instance
        'derekg1729/test-repo',
        123,
        'executor'
      )
    })

    test('failed merge returns error result', async () => {
      const mockServiceResult = {
        success: false,
        error: 'PR already merged',
        status: 422
      }
      mockGithubService.mergePR.mockResolvedValue(mockServiceResult)

      const result = await provider.mergePR(mockRepoRef, 123, 'executor', 'token')

      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('PR already merged')
      expect(result.status).toBe(422)
    })

    test('handles thrown exceptions', async () => {
      mockGithubService.mergePR.mockRejectedValue(new Error('Network error'))

      const result = await provider.mergePR(mockRepoRef, 123, 'executor', 'token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('addAdmin', () => {
    test('successful add admin returns success result', async () => {
      const mockServiceResult = {
        success: true,
        username: 'newuser',
        permission: 'admin',
        status: 200
      }
      mockGithubService.addAdmin.mockResolvedValue(mockServiceResult)

      const result = await provider.addAdmin(mockRepoRef, 'newuser', 'executor', 'token')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        username: 'newuser',
        permission: 'admin',
        status: 200
      })
      expect(mockGithubService.addAdmin).toHaveBeenCalledWith(
        expect.any(Object),
        'derekg1729/test-repo',
        'newuser',
        'executor'
      )
    })

    test('failed add admin returns error result', async () => {
      const mockServiceResult = {
        success: false,
        error: 'User not found',
        status: 404
      }
      mockGithubService.addAdmin.mockResolvedValue(mockServiceResult)

      const result = await provider.addAdmin(mockRepoRef, 'nonexistent', 'executor', 'token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
      expect(result.status).toBe(404)
    })
  })

  describe('removeAdmin', () => {
    test('successful remove collaborator returns success result', async () => {
      const mockServiceResult = {
        success: true,
        username: 'olduser',
        status: 204
      }
      mockGithubService.removeCollaborator.mockResolvedValue(mockServiceResult)

      const result = await provider.removeAdmin(mockRepoRef, 'olduser', 'executor', 'token')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        username: 'olduser',
        status: 204,
        operation: 'collaborator_removed'
      })
      expect(mockGithubService.removeCollaborator).toHaveBeenCalledWith(
        expect.any(Object),
        'derekg1729/test-repo',
        'olduser',
        'executor'
      )
    })

    test('falls back to invitation cancellation when collaborator removal fails', async () => {
      // Mock collaborator removal failure
      mockGithubService.removeCollaborator.mockResolvedValue({
        success: false,
        error: 'Not a collaborator',
        status: 404
      })

      // Mock successful invitation listing
      mockGithubService.listInvitations.mockResolvedValue({
        success: true,
        invitations: [
          { id: 123, invitee: { login: 'pendinguser' } }
        ],
        status: 200
      })

      // Mock successful invitation cancellation
      mockGithubService.cancelInvitation.mockResolvedValue({
        success: true,
        invitationId: 123,
        status: 204
      })

      const result = await provider.removeAdmin(mockRepoRef, 'pendinguser', 'executor', 'token')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        username: 'pendinguser',
        invitationId: 123,
        status: 204,
        operation: 'invitation_cancelled'
      })
      expect(mockGithubService.cancelInvitation).toHaveBeenCalledWith(
        expect.any(Object),
        'derekg1729/test-repo',
        123,
        'executor'
      )
    })
  })
})