/**
 * GitHub VCS Provider
 * 
 * Wraps existing GitHub service functions to implement VcsProvider interface
 */

import { Octokit } from 'octokit'

import * as githubService from '../../services/github'
import { RepoRef, VcsProvider, VcsResult } from './types'

/**
 * GitHub VCS Provider Implementation
 */
export class GitHubVcsProvider implements VcsProvider {
  readonly name = 'github'
  readonly host = 'github.com'

  /**
   * Merge pull request via GitHub API
   */
  async mergePR(repoRef: RepoRef, prNumber: number, executor: string, token: string): Promise<VcsResult> {
    try {
      const octokit = new Octokit({ auth: token })
      const repo = `${repoRef.owner}/${repoRef.repo}`
      
      const result = await githubService.mergePR(octokit, repo, prNumber, executor)
      
      return {
        success: result.success,
        data: result.success ? {
          sha: result.sha,
          merged: result.merged,
          message: result.message
        } : undefined,
        error: result.success ? undefined : result.error,
        status: result.status
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Add user as repository administrator
   */
  async addAdmin(repoRef: RepoRef, username: string, executor: string, token: string): Promise<VcsResult> {
    try {
      const octokit = new Octokit({ auth: token })
      const repo = `${repoRef.owner}/${repoRef.repo}`
      
      const result = await githubService.addAdmin(octokit, repo, username, executor)
      
      return {
        success: result.success,
        data: result.success ? {
          username: result.username,
          permission: result.permission,
          status: result.status
        } : undefined,
        error: result.success ? undefined : result.error,
        status: result.status
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Remove user as repository administrator
   */
  async removeAdmin(repoRef: RepoRef, username: string, executor: string, token: string): Promise<VcsResult> {
    try {
      const octokit = new Octokit({ auth: token })
      const repo = `${repoRef.owner}/${repoRef.repo}`
      
      // First try to remove active collaborator
      const removeResult = await githubService.removeCollaborator(octokit, repo, username, executor)
      
      if (removeResult.success) {
        return {
          success: true,
          data: {
            username: removeResult.username,
            status: removeResult.status,
            operation: 'collaborator_removed'
          },
          status: removeResult.status
        }
      }
      
      // If collaborator removal failed, try to cancel pending invitations
      const listResult = await githubService.listInvitations(octokit, repo, executor)
      
      if (!listResult.success) {
        return {
          success: false,
          error: `Failed to remove collaborator and list invitations: ${removeResult.error}`,
          status: removeResult.status
        }
      }
      
      // Find invitation for the username
      const invitation = listResult.invitations.find((inv: any) => 
        inv.invitee && inv.invitee.login === username
      )
      
      if (!invitation) {
        return {
          success: false,
          error: `User ${username} not found as collaborator or in pending invitations`,
          status: 404
        }
      }
      
      // Cancel the invitation
      const cancelResult = await githubService.cancelInvitation(octokit, repo, invitation.id, executor)
      
      return {
        success: cancelResult.success,
        data: cancelResult.success ? {
          username,
          invitationId: cancelResult.invitationId,
          status: cancelResult.status,
          operation: 'invitation_cancelled'
        } : undefined,
        error: cancelResult.success ? undefined : cancelResult.error,
        status: cancelResult.status
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: errorMessage
      }
    }
  }
}

/**
 * Default GitHub VCS provider instance
 */
export const gitHubVcsProvider = new GitHubVcsProvider()