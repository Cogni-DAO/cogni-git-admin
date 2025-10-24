/**
 * Signal Types
 * 
 * Single source of truth for CogniSignal event schema.
 * When ABI changes, only this file and parser.ts need updates.
 */

export type Vcs = 'github' | 'gitlab' | 'radicle';
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
  host: string;     // e.g., "github.com", "gitlab.com"
  owner: string;    // e.g., "owner"
  name: string;     // e.g., "repo"
  fullName: string; // e.g., "owner/repo"
}

export namespace RepoRef {
  /**
   * Parse repository reference from VCS URL
   * @param repoUrl - Full VCS URL (e.g., "https://github.com/owner/repo")
   * @returns Parsed repository reference
   */
  export function parse(repoUrl: string): RepoRef {
    try {
      const url = new URL(repoUrl);
      const pathname = url.pathname.slice(1).replace(/\.git$/, '');
      const [owner, name] = pathname.split('/');
      
      if (!owner || !name) {
        throw new Error(`Invalid repository path: ${pathname}`);
      }
      
      return {
        host: url.hostname,
        owner,
        name,
        fullName: `${owner}/${name}`
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse repository URL "${repoUrl}": ${message}`);
    }
  }
}