import { Application } from 'probot';

import { RepoRef } from '../signal/signal';

/**
 * Get authenticated Octokit client for a specific repository
 * @param app - Probot application instance
 * @param repo - Repository reference  
 * @returns Authenticated Octokit client with installation token
 */
export async function getOctokit(app: Application, repo: RepoRef) {
  try {
    // GitHub App (JWT) authentication
    const appOctokit = await app.auth();
    
    // Check if app is installed on this repository
    // TODO: Use appOctokit.rest.apps.getRepoInstallation when we upgrade to Probot 13+
    const { data } = await appOctokit.request({
      method: "GET",
      url: `/repos/${repo.owner}/${repo.repo}/installation`,
      headers: {},
    });
    const installationId = data.id;
    
    // Return authenticated Octokit client with installation token
    return app.auth(installationId);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      throw new Error(`GitHub App not installed on ${repo.owner}/${repo.repo}`);
    }
    throw error;
  }
}