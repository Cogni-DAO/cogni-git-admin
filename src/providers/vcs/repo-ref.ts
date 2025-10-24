/**
 * Repository Reference Parser
 * 
 * Parses repository URLs into structured RepoRef objects
 * Uses signal domain parser as single source of truth
 */

import { parseRepoRef, RepoRef } from '../../core/signal/signal';

/**
 * Parse repository URL into structured reference
 * Delegates to signal domain parser (single source of truth)
 * @param repoUrl Repository URL (e.g., "https://github.com/owner/repo")
 * @returns RepoRef with parsed components
 * @throws Error if URL format is invalid
 */
export function parseRepoUrl(repoUrl: string): RepoRef {
  return parseRepoRef(repoUrl);
}

/**
 * Check if host is supported (basic validation)
 * @param host VCS host
 * @returns True if host appears to be a valid VCS host
 */
export function isSupportedHost(host: string): boolean {
  const supportedHosts = [
    'github.com',
    'gitlab.com'
    // Add more as we support them
  ]
  
  return supportedHosts.includes(host.toLowerCase())
}