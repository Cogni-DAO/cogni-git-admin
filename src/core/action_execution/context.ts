/**
 * Action Execution Context
 * 
 * Resolved context for action execution with VCS provider.
 */

import { Application } from 'probot';

import { RepoRef } from '../signal/signal';
import { VcsProvider } from '../../providers/vcs/types';

/**
 * Execution context for action handlers
 * All parsing and validation happens before this point
 */
export interface ExecContext {
  repoRef: RepoRef;           // Parsed repository reference
  provider: VcsProvider;      // VCS provider with authenticated client
  logger: Application['log']; // Logger instance
  executor: string;           // Executor address from blockchain
  params: any;                // Parsed and validated parameters
}