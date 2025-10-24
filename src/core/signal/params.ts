/**
 * Signal Parameter Validation and Freshness Checks
 * 
 * VCS-aware parameter parsing and nonce/deadline validation
 */

import { Action, Target, Vcs } from './signal';

/**
 * Validate signal freshness using nonce and deadline
 * @param nonce - Unique nonce from signal
 * @param deadline - Unix timestamp deadline
 * @throws Error if signal is stale or expired
 */
export function ensureFresh(nonce: bigint, deadline: number): void {
  const now = Math.floor(Date.now() / 1000);
  
  if (deadline < now) {
    throw new Error(`Signal expired: deadline ${deadline} < now ${now}`);
  }
  
  // TODO: Check nonce against database/cache for replay protection
  // For MVP, accept nonce=0 (no replay protection) or any positive value
  if (nonce < BigInt(0)) {
    throw new Error(`Invalid nonce: ${nonce}. Must be >= 0`);
  }
  
  // Log nonce for future replay protection implementation
  if (nonce === BigInt(0)) {
    // MVP: No replay protection - log warning
    console.warn('Signal using nonce=0 (no replay protection)');
  } else {
    // Future: Store/check nonce in database keyed by (dao, repoUrl, nonce)
    console.info(`Signal nonce: ${nonce} (replay protection not implemented)`);
  }
}

/**
 * Parse and validate parameters with VCS/action context
 * @param vcs - VCS provider type
 * @param target - Action target
 * @param action - Action type
 * @param paramsJson - JSON parameters string
 * @returns Parsed and validated parameters
 */
export function parseParams(vcs: Vcs, target: Target, action: Action, paramsJson: string): any {
  if (!paramsJson || paramsJson.trim() === '') {
    return {};
  }
  
  let params: any;
  try {
    params = JSON.parse(paramsJson);
  } catch (error) {
    throw new Error(`Invalid JSON in paramsJson: ${paramsJson}`);
  }
  
  // VCS-specific parameter validation
  if (vcs === 'github') {
    return validateGitHubParams(target, action, params);
  }
  
  // Add other VCS providers as needed
  return params;
}

/**
 * Validate GitHub-specific parameters
 */
function validateGitHubParams(target: Target, action: Action, params: any): any {
  if (target === 'change' && action === 'merge') {
    // PR merge parameters
    if (params.prNumber !== undefined && typeof params.prNumber !== 'number') {
      throw new Error(`Invalid prNumber: expected number, got ${typeof params.prNumber}`);
    }
  }
  
  if (target === 'collaborator' && (action === 'grant' || action === 'revoke')) {
    // Admin operations parameters
    if (params.username !== undefined && typeof params.username !== 'string') {
      throw new Error(`Invalid username: expected string, got ${typeof params.username}`);
    }
  }
  
  return params;
}

/**
 * Convert Signal to JSON-serializable object for logging (re-export)
 */
export { signalToLog } from './signal';