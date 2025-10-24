/**
 * Repository Reference Parser
 * 
 * Parses repository URLs into structured RepoRef objects
 */

import { URL } from 'node:url';

import { RepoRef as IRepoRef } from './types'

/**
 * Parse repository URL into structured reference
 * @param repoUrl Repository URL (e.g., "https://github.com/owner/repo")
 * @returns RepoRef with parsed components
 * @throws Error if URL format is invalid
 */
export function parseRepoUrl(repoUrl: string): IRepoRef {
  if (!repoUrl || typeof repoUrl !== 'string') {
    throw new Error('Repository URL must be a non-empty string')
  }

  let url: URL
  try {
    url = new URL(repoUrl)
  } catch (error) {
    throw new Error(`Invalid repository URL format: ${repoUrl}`)
  }

  // Extract host
  const host = url.hostname
  if (!host) {
    throw new Error(`Could not extract host from URL: ${repoUrl}`)
  }

  // Parse pathname (e.g., "/owner/repo" or "/owner/repo.git")
  const pathname = url.pathname
  if (!pathname || pathname === '/') {
    throw new Error(`Invalid repository path in URL: ${repoUrl}`)
  }

  // Remove leading slash and optional .git suffix
  const pathParts = pathname.slice(1).replace(/\.git$/, '').split('/')
  
  if (pathParts.length < 2) {
    throw new Error(`Repository URL must contain owner and repo: ${repoUrl}`)
  }

  const [owner, repo] = pathParts

  if (!owner || !repo) {
    throw new Error(`Owner and repository name cannot be empty: ${repoUrl}`)
  }

  return {
    host,
    owner,
    repo,
    url: repoUrl
  }
}

/**
 * Utility class for repository reference operations
 */
export class RepoRef {
  /**
   * Parse repository URL into RepoRef
   * @param repoUrl Repository URL
   * @returns Parsed RepoRef
   */
  static parse(repoUrl: string): IRepoRef {
    return parseRepoUrl(repoUrl)
  }

  /**
   * Format RepoRef as owner/repo string
   * @param repoRef Repository reference
   * @returns Formatted string
   */
  static format(repoRef: IRepoRef): string {
    return `${repoRef.owner}/${repoRef.repo}`
  }

  /**
   * Check if host is supported (basic validation)
   * @param host VCS host
   * @returns True if host appears to be a valid VCS host
   */
  static isSupportedHost(host: string): boolean {
    const supportedHosts = [
      'github.com',
      'gitlab.com'
      // Add more as we support them
    ]
    
    return supportedHosts.includes(host.toLowerCase())
  }
}