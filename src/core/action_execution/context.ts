/**
 * Action Execution Context
 * 
 * Resolved context for action execution.
 * Contains parsed repo info, provider resolution, and execution metadata.
 */

import { Application } from 'probot';

import { RepoRef, Vcs } from '../signal/signal';

/**
 * Execution context for action handlers
 * All schema-specific parsing and resolution happens before this point
 */
export interface ExecContext {
  repoRef: RepoRef;           // Parsed repository reference
  provider: Vcs;              // VCS provider (for future multi-VCS routing)
  octokit: any;               // Authenticated VCS client (GitHub for now)
  logger: Application['log']; // Logger instance
  executor: string;           // Executor address from blockchain
  params: any;                // Parsed JSON parameters from paramsJson
}

/**
 * Safely parse JSON parameters with fallback
 * @param paramsJson - JSON string from blockchain event
 * @returns Parsed object or empty object if invalid
 */
export function safeParseParams(paramsJson: string): any {
  if (!paramsJson || paramsJson.trim() === '') {
    return {};
  }
  
  try {
    return JSON.parse(paramsJson);
  } catch (error) {
    console.warn(`Failed to parse params JSON: ${paramsJson}`, error);
    return {};
  }
}