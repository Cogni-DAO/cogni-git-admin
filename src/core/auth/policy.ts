/**
 * VCS-agnostic authorization policy
 * 
 * Centralized authorization check that validates DAO permissions for repository access
 * across all VCS providers. Single source of truth for access control.
 */

import { Vcs } from '../signal/signal';

interface RepoPolicy {
  host: string;
  owner: string;
  repo: string;
}

/**
 * Authorize DAO access to repository across any VCS
 * @param dao - DAO address requesting access
 * @param chainId - Chain ID for the DAO
 * @param vcs - VCS type (github, gitlab, radicle)
 * @param repo - Repository reference with host, owner, repo
 * @throws Error if DAO is not authorized for this repository
 */
export async function authorize(dao: string, chainId: bigint, vcs: Vcs, repo: RepoPolicy): Promise<void> {
  // TODO: SQLite allowlist lookup: (dao, chainId, vcs, host, owner, repo)
  const allowed = await isAllowlisted(dao, chainId, vcs, repo.host, repo.owner, repo.repo);
  if (!allowed) {
    throw new Error(`Unauthorized: DAO ${dao} not allowed for ${vcs}://${repo.host}/${repo.owner}/${repo.repo}`);
  }
}

/**
 * Check if DAO is allowlisted for repository access
 * @param dao - DAO address
 * @param chainId - Chain ID  
 * @param vcs - VCS type
 * @param host - Repository host
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Promise<boolean> - Whether access is allowed
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function isAllowlisted(dao: string, chainId: bigint, vcs: Vcs, host: string, owner: string, repo: string): Promise<boolean> {
  // TODO: Implement SQLite allowlist lookup
  // SELECT COUNT(*) FROM allowlist WHERE dao = ? AND chain_id = ? AND vcs = ? AND host = ? AND owner = ? AND repo = ?
  
  // MVP: Allow all for now (unsafe!)
  // Future: Replace with database-backed allowlist
  return Promise.resolve(true);
}