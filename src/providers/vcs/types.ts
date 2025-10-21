/**
 * VCS Provider Type Definitions
 * 
 * Interfaces for blockchain-initiated repository administration across different VCS platforms
 */

/**
 * Repository reference parsed from URL
 */
export interface RepoRef {
  /** VCS host (e.g., "github.com", "gitlab.com") */
  host: string
  /** Repository owner/organization */
  owner: string  
  /** Repository name */
  repo: string
  /** Full repository URL for reference */
  url: string
}

/**
 * Structured result from VCS operations
 */
export interface VcsResult {
  /** Operation success status */
  success: boolean
  /** Operation-specific data (e.g., SHA for merge, status code for admin ops) */
  data?: Record<string, any>
  /** Error message if operation failed */
  error?: string
  /** HTTP status code or provider-specific error code */
  status?: number
}

/**
 * VCS provider interface for repository administration operations
 */
export interface VcsProvider {
  /** Provider identifier */
  readonly name: string
  /** VCS host this provider handles */
  readonly host: string
  
  /**
   * Merge pull request/merge request
   * @param repoRef Repository reference
   * @param prNumber PR/MR number  
   * @param executor Identity of executor from blockchain event
   * @param token Access token for authentication
   * @returns Operation result with merge details
   */
  mergePR(repoRef: RepoRef, prNumber: number, executor: string, token: string): Promise<VcsResult>
  
  /**
   * Add user as repository administrator
   * @param repoRef Repository reference
   * @param username Username to add as admin
   * @param executor Identity of executor from blockchain event  
   * @param token Access token for authentication
   * @returns Operation result with admin assignment details
   */
  addAdmin(repoRef: RepoRef, username: string, executor: string, token: string): Promise<VcsResult>
  
  /**
   * Remove user as repository administrator
   * @param repoRef Repository reference
   * @param username Username to remove as admin
   * @param executor Identity of executor from blockchain event
   * @param token Access token for authentication  
   * @returns Operation result with admin removal details
   */
  removeAdmin(repoRef: RepoRef, username: string, executor: string, token: string): Promise<VcsResult>
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