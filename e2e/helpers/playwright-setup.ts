import { execSync } from 'child_process';

export interface E2EEnvironment {
  deploymentUrl: string;
  ghToken: string | null;
  testRepo: string;
  timeoutSec: number;
}

export interface PRState {
  number: number;
  state: 'open' | 'closed';
  merged: boolean;
  mergeable?: boolean | null;
}

/**
 * Validates and parses E2E environment variables
 */
export function validateE2EEnvironment(): E2EEnvironment {
  const required = ['E2E_APP_DEPLOYMENT_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    deploymentUrl: process.env.E2E_APP_DEPLOYMENT_URL!,
    ghToken: process.env.E2E_TEST_REPO_GITHUB_PAT || null,
    testRepo: process.env.TEST_REPO || 'derekg1729/test-repo',
    timeoutSec: parseInt(process.env.TIMEOUT_SEC || '30', 10)
  };
}

/**
 * Gets current GitHub PR state using gh CLI
 */
export async function getPRState(repo: string, prNumber: number, token?: string | null): Promise<PRState | null> {
  if (!token) {
    return null;
  }

  try {
    const result = execSync(`gh api repos/${repo}/pulls/${prNumber}`, {
      env: { ...process.env, GH_TOKEN: token },
      encoding: 'utf8',
      timeout: 10000
    });
    
    const pr = JSON.parse(result);
    return {
      number: pr.number,
      state: pr.state,
      merged: pr.merged,
      mergeable: pr.mergeable
    };
  } catch (error) {
    console.warn(`Could not fetch PR state for ${repo}#${prNumber}: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Waits for GitHub operation to complete with exponential backoff
 */
export async function waitForGitHubOperation(
  repo: string, 
  prNumber: number, 
  token: string | null,
  maxWaitMs: number = 10000
): Promise<PRState | null> {
  if (!token) return null;
  
  const startTime = Date.now();
  const delays = [1000, 2000, 3000, 4000]; // Exponential backoff
  
  for (const delay of delays) {
    if (Date.now() - startTime > maxWaitMs) break;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    const state = await getPRState(repo, prNumber, token);
    
    if (state) {
      return state;
    }
  }
  
  return null;
}

/**
 * Creates webhook URL for deployment
 */
export function createWebhookUrl(deploymentUrl: string, endpoint: string = '/api/v1/webhooks/onchain/cogni-signal'): string {
  return new URL(endpoint, deploymentUrl).toString();
}

/**
 * Compares PR states to determine what changed
 */
export function analyzePRStateChange(before: PRState | null, after: PRState | null): {
  type: 'merged' | 'already_merged' | 'no_change' | 'unknown';
  description: string;
} {
  if (!before || !after) {
    return { type: 'unknown', description: 'Could not determine PR state change' };
  }
  
  if (before.merged === false && after.merged === true) {
    return { type: 'merged', description: 'PR was successfully merged' };
  }
  
  if (after.merged === true) {
    return { type: 'already_merged', description: 'PR was already merged' };
  }
  
  return { type: 'no_change', description: `PR merge state unchanged: merged=${after.merged}` };
}