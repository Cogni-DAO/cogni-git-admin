/**
 * VCS Provider Factory
 * 
 * Single authentication boundary that creates authenticated VCS provider instances.
 * Handles all VCS-specific authentication internally.
 */

import { Application } from 'probot';

import { getOctokit } from '../core/auth/github';
import { authorize } from '../core/auth/policy';
import { RepoRef, Vcs } from '../core/signal/signal';
import { GitHubVcsProvider } from '../providers/vcs/github';
import { VcsProvider } from '../providers/vcs/types';

/**
 * Create authenticated VCS provider for the given VCS type and repository
 * @param vcs - VCS type (github, gitlab, etc.)
 * @param app - Probot application instance for GitHub authentication
 * @param repoRef - Repository reference for scoped authentication
 * @param dao - DAO address for future auth validation
 * @param chainId - Chain ID for future auth validation
 * @returns Configured VCS provider with authenticated client
 */
export async function createVcsProvider(vcs: Vcs, app: Application, repoRef: RepoRef, dao: string, chainId: bigint): Promise<VcsProvider> {
  // VCS-agnostic authorization check
  await authorize(dao, chainId, vcs, repoRef);
  
  switch (vcs) {
    case 'github': {
      const octokit = await getOctokit(app, repoRef);
      return new GitHubVcsProvider(octokit);
    }
    
    case 'gitlab': {
      // Future: GitLab provider implementation
      // const api = new Gitlab({ token: GITLAB_TOKEN_FOR(repoRef.host), host: `https://${repoRef.host}` });
      // return new GitLabVcsProvider(api);
      throw new Error(`GitLab provider not implemented yet`);
    }
    
    case 'radicle': {
      // Future: Radicle provider implementation
      throw new Error(`Radicle provider not implemented yet`);
    }
    
    default:
      throw new Error(`Unsupported VCS: ${String(vcs)}`);
  }
}