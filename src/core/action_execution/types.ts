import { Octokit } from 'octokit';
import { Application } from 'probot';

export interface CogniActionParsed {
  dao: string;
  chainId: bigint;
  repo: string;
  action: string;
  target: string;
  pr: number;
  commit: string;
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
  [key: string]: any; // Allow additional result data
}

export interface ActionHandler {
  // Action metadata
  readonly action: string;        // "PR_APPROVE"
  readonly target: string;        // "pull_request" 
  readonly description: string;   // Human readable description
  
  // Validation
  validate(parsed: CogniActionParsed): Promise<ValidationResult>;
  
  // Execution  
  execute(parsed: CogniActionParsed, octokit: Octokit, logger: Application['log']): Promise<ActionResult>;
}