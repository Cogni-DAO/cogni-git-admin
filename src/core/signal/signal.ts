/**
 * Signal Types
 * 
 * Single source of truth for CogniSignal event schema.
 * When ABI changes, only this file and parser.ts need updates.
 */

import { URL } from 'node:url';

export const VCS = ['github', 'gitlab', 'radicle'] as const;
export type Vcs = typeof VCS[number];

export function isValidVcs(x: unknown): x is Vcs {
  return typeof x === 'string' && (VCS as readonly string[]).includes(x.toLowerCase());
}
export type Target = 'change' | 'collaborator';  
export type Action = 'merge' | 'grant' | 'revoke';

/**
 * Parsed CogniSignal event data
 * Contains all fields from the blockchain event in typed format
 */
export interface Signal {
  dao: string;
  chainId: bigint;
  vcs: Vcs;
  repoUrl: string;
  action: Action;
  target: Target;
  resource: string;
  nonce: bigint;
  deadline: number;
  paramsJson: string;
  executor: string;
}

/**
 * Convert Signal to JSON-serializable object for logging
 */
export function signalToLog(signal: Signal) {
  return {
    dao: signal.dao,
    chainId: signal.chainId.toString(),
    vcs: signal.vcs,
    repoUrl: signal.repoUrl,
    action: signal.action,
    target: signal.target,
    resource: signal.resource,
    nonce: signal.nonce.toString(),
    deadline: signal.deadline,
    paramsJson: signal.paramsJson,
    executor: signal.executor
  };
}

/**
 * Repository reference parsed from repoUrl
 */
export interface RepoRef {
  host: string;      // e.g., "github.com", "gitlab.com"
  owner: string;     // e.g., "owner" or "acme/platform" (GitLab subgroups)
  repo: string;      // e.g., "repo"
  url: string;       // e.g., "https://github.com/owner/repo"
}

// Helper functions (replace name/fullName usage)
export const fullName = (r: RepoRef) => `${r.owner}/${r.repo}`;
export const name = (r: RepoRef) => r.repo;

/**
 * Parse repository reference from VCS URL with GitLab subgroup support
 * @param repoUrl - Full VCS URL (e.g., "https://github.com/owner/repo")
 * @returns Parsed repository reference
 */
export function parseRepoRef(repoUrl: string): RepoRef {
  try {
    const url = new URL(repoUrl);
    
    // Strip query/fragment and .git suffix
    const cleanUrl = `${url.protocol}//${url.host}${url.pathname}`.replace(/\.git$/, '');
    
    // Parse pathname: remove leading /, split by /
    const pathname = url.pathname.slice(1).replace(/\.git$/, '');
    const pathSegments = pathname.split('/').filter(segment => segment.length > 0);
    
    if (pathSegments.length < 2) {
      throw new Error(`Repository URL must contain owner and repo: ${repoUrl}`);
    }
    
    // repo = last segment, owner = all preceding segments joined
    const repo = pathSegments[pathSegments.length - 1];
    const owner = pathSegments.slice(0, -1).join('/');
    
    if (!owner || !repo) {
      throw new Error(`Invalid repository path: ${pathname}`);
    }
    
    return {
      host: url.hostname.toLowerCase(),
      owner,
      repo,
      url: cleanUrl
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse repository URL "${repoUrl}": ${message}`);
  }
}