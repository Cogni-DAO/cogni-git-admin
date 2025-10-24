import { Octokit } from 'octokit';
import { Application } from 'probot';

import { addAdmin } from '../../../services/github';
import { ActionHandler, ActionResult,CogniActionParsed, ValidationResult } from '../types';

export const addAdminAction: ActionHandler = {
  action: "grant",
  target: "collaborator",
  description: "Grant admin access to a user via DAO vote",

  validate(parsed: CogniActionParsed): ValidationResult {
    if (!parsed.repoUrl) {
      return { valid: false, error: 'repoUrl is required' };
    }
    
    if (!parsed.resource) {
      return { valid: false, error: 'Username required in resource field' };
    }
    
    // Basic GitHub username validation
    if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(parsed.resource)) {
      return { valid: false, error: `Invalid GitHub username format: ${parsed.resource}` };
    }
    
    return { valid: true };
  },

  async execute(parsed: CogniActionParsed, octokit: Octokit, logger: Application['log']): Promise<ActionResult> {
    const { repoUrl, resource: username, executor } = parsed;
    
    // Parse repo from URL
    const url = new URL(repoUrl);
    const repo = url.pathname.slice(1).replace(/\.git$/, '');
    
    logger.info(`Executing ${this.action} for repoUrl=${repoUrl}, username=${username}, executor=${executor}`);
    
    const result = await addAdmin(octokit, repo, username, executor);
    
    if (result.success) {
      logger.info(`Successfully added ${username} as admin to ${repo}`, { username, status: result.status });
      return { 
        success: true, 
        action: 'admin_added', 
        username, 
        permission: 'admin',
        repoUrl
      };
    } else {
      logger.error(`Failed to add ${username} as admin to ${repo}`, { error: result.error, status: result.status });
      return { 
        success: false, 
        action: 'admin_add_failed', 
        error: result.error, 
        username,
        repoUrl
      };
    }
  }
};