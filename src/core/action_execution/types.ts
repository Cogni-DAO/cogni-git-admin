import { Signal } from '../signal/signal';
import { ExecContext } from './context';

/**
 * VCS-specific parameter interfaces
 * These are additional parameters from paramsJson, not the core action data
 * (PR numbers, usernames come from signal.resource)
 */
export interface MergeChangeParams {
  mergeMethod?: 'merge' | 'squash' | 'rebase';
  commitTitle?: string;
  commitMessage?: string;
}

export interface GrantCollaboratorParams {
  permission?: 'admin' | 'maintain' | 'write';
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RevokeCollaboratorParams {
  // Currently no additional parameters needed
}

/**
 * Action-specific execution context types
 */
export interface MergeExecContext {
  repoRef: import('../signal/signal').RepoRef;
  provider: import('../../providers/vcs/types').VcsProvider;
  logger: import('probot').Application['log'];
  executor: string;
  params: MergeChangeParams;
}

export interface GrantExecContext {
  repoRef: import('../signal/signal').RepoRef;
  provider: import('../../providers/vcs/types').VcsProvider;
  logger: import('probot').Application['log'];
  executor: string;
  params: GrantCollaboratorParams;
}

export interface RevokeExecContext {
  repoRef: import('../signal/signal').RepoRef;
  provider: import('../../providers/vcs/types').VcsProvider;
  logger: import('probot').Application['log'];
  executor: string;
  params: RevokeCollaboratorParams;
}

export interface ActionResult {
  success: boolean;
  action: string;
  error?: string;
  // Domain-specific additional properties that actions can include
  username?: string;
  repo?: string;
  permission?: string;
  prNumber?: number;
  collaboratorRemoved?: boolean;
  invitationCancelled?: boolean;
  // Special case for availableActions array
  availableActions?: string[];
  // Allow other string/number/boolean values for extensibility
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface ActionHandler {
  // Action metadata
  readonly action: string;        // "merge"
  readonly target: string;        // "change" 
  readonly description: string;   // Human readable description
  
  // Signal-based execution
  run(signal: Signal, ctx: ExecContext): Promise<ActionResult>;
}