import { Octokit } from 'octokit';
import { Application } from 'probot';

import { mergePR } from '../../../services/github';
import { ActionHandler, ActionResult,CogniActionParsed, ValidationResult } from '../types';

export const mergePRAction: ActionHandler = {
  action: "PR_APPROVE",
  target: "pull_request",
  description: "Merge a pull request via DAO vote",

  async validate(parsed: CogniActionParsed): Promise<ValidationResult> {
    if (parsed.pr <= 0) {
      return { valid: false, error: 'PR number must be greater than 0' };
    }
    
    if (!parsed.repo.includes('/')) {
      return { valid: false, error: 'Repo must be in format "owner/repo"' };
    }
    
    return { valid: true };
  },

  async execute(parsed: CogniActionParsed, octokit: Octokit, logger: Application['log']): Promise<ActionResult> {
    const { repo, pr, executor } = parsed;
    
    logger.info(`Executing ${this.action} for repo=${repo}, pr=${pr}, executor=${executor}`);
    
    const result = await mergePR(octokit, repo, pr, executor);
    
    if (result.success) {
      logger.info(`Successfully merged PR #${pr} in ${repo}`, { sha: result.sha });
      return { 
        success: true, 
        action: 'merge_completed', 
        sha: result.sha,
        repo,
        pr
      };
    } else {
      logger.error(`Failed to merge PR #${pr} in ${repo}`, { error: result.error, status: result.status });
      return { 
        success: false, 
        action: 'merge_failed', 
        error: result.error,
        repo,
        pr
      };
    }
  }
};