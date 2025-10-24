import { Octokit } from 'octokit';
import { Application } from 'probot';

export interface CogniActionParsed {
  dao: string;
  chainId: bigint;
  repoUrl: string;
  action: string;
  target: string;
  resource: string;
  extra: string;
  executor: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
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
  readonly action: string;        // "PR_APPROVE"
  readonly target: string;        // "pull_request" 
  readonly description: string;   // Human readable description
  
  // Validation
  validate(parsed: CogniActionParsed): ValidationResult;
  
  // Execution  
  execute(parsed: CogniActionParsed, octokit: Octokit, logger: Application['log']): Promise<ActionResult>;
}