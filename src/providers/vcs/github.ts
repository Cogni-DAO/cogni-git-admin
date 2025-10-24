/**
 * GitHub VCS Provider
 * 
 * Wraps existing GitHub service functions to implement VcsProvider interface
 */

import { Octokit } from 'octokit'

import * as githubService from '../../services/github'
import { GrantCollaboratorResult, MergeResult, RepoRef, RevokeCollaboratorResult, VcsProvider } from './types'
import { MergeChangeParams, GrantCollaboratorParams, RevokeCollaboratorParams } from '../../core/action_execution/types'

/**
 * GitHub VCS Provider Implementation
 */
export class GitHubVcsProvider implements VcsProvider {
  constructor(private octokit: Octokit) {}

  /**
   * Merge pull request via GitHub API
   */
  async mergeChange(repoRef: RepoRef, prNumber: number, params: MergeChangeParams): Promise<MergeResult> {
    try {
      const repo = `${repoRef.owner}/${repoRef.repo}`
      
      const result = await githubService.mergePR(this.octokit, repo, prNumber, params)
      
      return {
        success: result.success,
        sha: result.sha,
        merged: result.merged,
        message: result.message,
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
  async grantCollaborator(repoRef: RepoRef, username: string, params: GrantCollaboratorParams): Promise<GrantCollaboratorResult> {
    try {
      const repo = `${repoRef.owner}/${repoRef.repo}`
      
      const result = await githubService.addAdmin(this.octokit, repo, username, params.permission)
      
      return {
        success: result.success,
        username: result.username,
        permission: result.permission,
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
  async revokeCollaborator(repoRef: RepoRef, username: string, _params: RevokeCollaboratorParams): Promise<RevokeCollaboratorResult> {
    try {
      const repo = `${repoRef.owner}/${repoRef.repo}`
      
      // Step 1: Always try to remove active collaborator (will succeed even if user wasn't a collaborator)
      const removeResult = await githubService.removeCollaborator(this.octokit, repo, username)
      
      // Step 2: Always check for and cancel pending invitations
      const listResult = await githubService.listInvitations(this.octokit, repo)
      
      if (!listResult.success) {
        // If we can't list invitations but collaborator removal succeeded, that's still success
        if (removeResult.success) {
          return {
            success: true,
            username: removeResult.username,
            operation: 'collaborator_removed',
            status: removeResult.status
          }
        }
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
      
      if (invitation) {
        // Cancel the invitation
        const cancelResult = await githubService.cancelInvitation(this.octokit, repo, invitation.id)
        
        return {
          success: true, // Success if either collaborator removed or invitation cancelled
          username,
          invitationId: cancelResult.invitationId,
          operation: cancelResult.success ? 'invitation_cancelled' : 'collaborator_removed',
          status: cancelResult.status || removeResult.status
        }
      }
      
      // No invitation found, return collaborator removal result
      return {
        success: true, // GitHub removeCollaborator succeeds even if user wasn't a collaborator
        username: removeResult.username,
        operation: 'collaborator_removed',
        status: removeResult.status
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

