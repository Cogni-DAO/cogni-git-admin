import { Octokit } from 'octokit';
import { Application } from 'probot';

import { mergePR } from '../../../services/github';
import { ActionHandler, ActionResult,CogniActionParsed, ValidationResult } from '../types';

export const mergePRAction: ActionHandler = {
  action: "merge",
  target: "change",
  description: "Merge a change request (PR/MR/patch) via DAO vote",

  validate(parsed: CogniActionParsed): ValidationResult {
    const changeNumber = parseInt(parsed.resource, 10);
    if (isNaN(changeNumber) || changeNumber <= 0) {
      return { valid: false, error: 'Resource must be a valid change number greater than 0' };
    }
    
    if (!parsed.repoUrl) {
      return { valid: false, error: 'repoUrl is required' };
    }
    
    return { valid: true };
  },

  async execute(parsed: CogniActionParsed, octokit: Octokit, logger: Application['log']): Promise<ActionResult> {
    const changeNumber = parseInt(parsed.resource, 10);
    const { repoUrl, executor } = parsed;
    
    // Parse repo from URL
    const url = new URL(repoUrl);
    const repo = url.pathname.slice(1).replace(/\.git$/, '');
    
    logger.info(`Executing ${this.action} for repoUrl=${repoUrl}, change=${changeNumber}, executor=${executor}`);
    
    const result = await mergePR(octokit, repo, changeNumber, executor);
    
    if (result.success) {
      logger.info(`Successfully merged change #${changeNumber} in ${repo}`, { sha: result.sha });
      return { 
        success: true, 
        action: 'merge_completed', 
        sha: result.sha,
        repoUrl,
        changeNumber
      };
    } else {
      logger.error(`Failed to merge change #${changeNumber} in ${repo}`, { error: result.error, status: result.status });
      return { 
        success: false, 
        action: 'merge_failed', 
        error: result.error,
        repoUrl,
        changeNumber
      };
    }
  }
};