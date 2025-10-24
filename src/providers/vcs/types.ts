/**
 * VCS Provider Type Definitions
 * 
 * Interfaces for blockchain-initiated repository administration across different VCS platforms
 */

// Import RepoRef from signal domain (single source of truth)
import { RepoRef } from '../../core/signal/signal';
// Import parameter types from action execution types
import { MergeChangeParams, GrantCollaboratorParams, RevokeCollaboratorParams } from '../../core/action_execution/types';

// Re-export for convenience
export { RepoRef };

/**
 * Base result interface for VCS operations
 */
interface VcsResultBase {
  /** Operation success status */
  success: boolean
  /** Error message if operation failed */
  error?: string
  /** HTTP status code or provider-specific error code */
  status?: number
}

/**
 * Result from merge operations
 */
export interface MergeResult extends VcsResultBase {
  /** Merge commit SHA if successful */
  sha?: string
  /** Whether merge was completed */
  merged?: boolean
  /** Status message from VCS provider */
  message?: string
}

/**
 * Result from grant collaborator operations
 */
export interface GrantCollaboratorResult extends VcsResultBase {
  /** Username that was granted access */
  username?: string
  /** Permission level granted */
  permission?: string
}

/**
 * Result from revoke collaborator operations
 */
export interface RevokeCollaboratorResult extends VcsResultBase {
  /** Username that was revoked */
  username?: string
  /** Operation type (collaborator_removed, invitation_cancelled) */
  operation?: string
  /** Invitation ID for cancelled invitations */
  invitationId?: number
}

/**
 * VCS provider interface for repository administration operations
 * Clean, minimal interface with authenticated client encapsulated in provider
 */
export interface VcsProvider {
  /**
   * Merge pull request/merge request
   * @param repoRef Repository reference
   * @param prNumber PR/MR number  
   * @param params Provider-specific merge parameters
   * @returns Operation result with merge details
   */
  mergeChange(repoRef: RepoRef, prNumber: number, params: MergeChangeParams): Promise<MergeResult>
  
  /**
   * Add user as repository administrator
   * @param repoRef Repository reference
   * @param username Username to add as admin
   * @param params Provider-specific grant parameters
   * @returns Operation result with admin assignment details
   */
  grantCollaborator(repoRef: RepoRef, username: string, params: GrantCollaboratorParams): Promise<GrantCollaboratorResult>
  
  /**
   * Remove user as repository administrator
   * @param repoRef Repository reference
   * @param username Username to remove as admin
   * @param params Provider-specific revoke parameters
   * @returns Operation result with admin removal details
   */
  revokeCollaborator(repoRef: RepoRef, username: string, params: RevokeCollaboratorParams): Promise<RevokeCollaboratorResult>
}

/**
 * VCS provider registry interface
 */
export interface VcsProviderRegistry {
  /**
   * Get VCS provider for host
   * @param host VCS host (e.g., "github.com")
   * @returns VCS provider or undefined if not supported
   */
  get(host: string): VcsProvider | undefined
  
  /**
   * Register VCS provider for host
   * @param host VCS host 
   * @param provider VCS provider implementation
   */
  register(host: string, provider: VcsProvider): void
  
  /**
   * List all supported hosts
   * @returns Array of supported VCS hosts
   */
  getSupportedHosts(): string[]
}

/**
 * Token source interface for VCS authentication
 */
export interface TokenSource {
  /**
   * Get access token for repository operations
   * @param host VCS host (e.g., "github.com")
   * @param owner Repository owner/organization
   * @returns Access token or throws if unavailable
   */
  getToken(host: string, owner: string): Promise<string>
}