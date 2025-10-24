/**
 * VCS Provider Factory
 * 
 * Single authentication boundary that creates authenticated VCS provider instances.
 * Handles all VCS-specific authentication internally.
 */

import { Application } from 'probot';

import { getInstallationId } from '../core/auth/github';
import { RepoRef, Vcs } from '../core/signal/signal';
import { GitHubVcsProvider } from '../providers/vcs/github';
import { VcsProvider } from '../providers/vcs/types';

/**
 * Create authenticated VCS provider for the given VCS type and repository
 * @param vcs - VCS type (github, gitlab, etc.)
 * @param app - Probot application instance for GitHub authentication
 * @param repoRef - Repository reference for scoped authentication
 * @param dao - DAO address for GitHub App installation lookup
 * @returns Configured VCS provider with authenticated client
 */
export async function createVcsProvider(vcs: Vcs, app: Application, repoRef: RepoRef, dao: string): Promise<VcsProvider> {
  switch (vcs) {
    case 'github': {
      // Get GitHub App installation ID for this repository
      const repo = `${repoRef.owner}/${repoRef.repo}`;
      const installationId = getInstallationId(dao, repo);
      
      // Get authenticated Octokit client from Probot
      const octokit = await app.auth(Number(installationId));
      
      // Create GitHub provider with authenticated client
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
      throw new Error(`Unsupported VCS: ${vcs}`);
  }
}