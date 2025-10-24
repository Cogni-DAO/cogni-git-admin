/**
 * Signal Parameter Validation and Freshness Checks
 * 
 * VCS-aware parameter parsing and nonce/deadline validation
 */

import { GrantCollaboratorParams, MergeChangeParams, RevokeCollaboratorParams } from '../action_execution/types';
import { Action, Target } from './signal';

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
 * Parse merge change parameters
 */
export function parseMergeParams(paramsJson: string): MergeChangeParams {
  if (!paramsJson || paramsJson.trim() === '') {
    return {};
  }
  
  const rawParams = parseJsonParams(paramsJson);
  return validateMergeParams(rawParams);
}

/**
 * Parse grant collaborator parameters  
 */
export function parseGrantParams(paramsJson: string): GrantCollaboratorParams {
  if (!paramsJson || paramsJson.trim() === '') {
    return {};
  }
  
  const rawParams = parseJsonParams(paramsJson);
  return validateGrantParams(rawParams);
}

/**
 * Parse revoke collaborator parameters
 */
export function parseRevokeParams(paramsJson: string): RevokeCollaboratorParams {
  if (!paramsJson || paramsJson.trim() === '') {
    return {};
  }
  
  const rawParams = parseJsonParams(paramsJson);
  return validateRevokeParams(rawParams);
}

/**
 * Helper: Parse JSON parameters with validation
 */
function parseJsonParams(paramsJson: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(paramsJson);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Parameters must be a JSON object');
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error(`Invalid JSON in paramsJson: ${paramsJson}`);
  }
}

/**
 * Validate merge change parameters
 */
function validateMergeParams(params: Record<string, unknown>): MergeChangeParams {
  const result: MergeChangeParams = {};
  
  if ('mergeMethod' in params) {
    const method = params.mergeMethod;
    if (typeof method === 'string' && ['merge', 'squash', 'rebase'].includes(method)) {
      result.mergeMethod = method as 'merge' | 'squash' | 'rebase';
    } else {
      throw new Error(`Invalid mergeMethod: must be 'merge', 'squash', or 'rebase'`);
    }
  }
  
  if ('commitTitle' in params && typeof params.commitTitle === 'string') {
    result.commitTitle = params.commitTitle;
  }
  
  if ('commitMessage' in params && typeof params.commitMessage === 'string') {
    result.commitMessage = params.commitMessage;
  }
  
  return result;
}

/**
 * Validate grant collaborator parameters
 */
function validateGrantParams(params: Record<string, unknown>): GrantCollaboratorParams {
  const result: GrantCollaboratorParams = {};
  
  if ('permission' in params) {
    const perm = params.permission;
    if (typeof perm === 'string' && ['admin', 'maintain', 'write'].includes(perm)) {
      result.permission = perm as 'admin' | 'maintain' | 'write';
    } else {
      throw new Error(`Invalid permission: must be 'admin', 'maintain', or 'write'`);
    }
  }
  
  return result;
}

/**
 * Validate revoke collaborator parameters
 */
function validateRevokeParams(params: Record<string, unknown>): RevokeCollaboratorParams {
  // No additional parameters needed for revoke
  return {};
}

/**
 * Generic parameter parsing function that dispatches to specific parsers
 */
export function parseParams(action: Action, target: Target, paramsJson: string): MergeChangeParams | GrantCollaboratorParams | RevokeCollaboratorParams {
  const key = `${action}:${target}`;
  
  switch (key) {
    case 'merge:change':
      return parseMergeParams(paramsJson);
    case 'grant:collaborator':  
      return parseGrantParams(paramsJson);
    case 'revoke:collaborator':
      return parseRevokeParams(paramsJson);
    default:
      throw new Error(`Unknown action:target combination: ${key}`);
  }
}

/**
 * Convert Signal to JSON-serializable object for logging (re-export)
 */
export { signalToLog } from './signal';