import { Octokit } from 'octokit';
import { Application } from 'probot';

import { addAdmin } from '../../../services/github';
import { ActionHandler, ActionResult,CogniActionParsed, ValidationResult } from '../types';

export const addAdminAction: ActionHandler = {
  action: "ADD_ADMIN",
  target: "repository",
  description: "Add a user as repository admin via DAO vote",

  validate(parsed: CogniActionParsed): ValidationResult {
    if (!parsed.repo.includes('/')) {
      return { valid: false, error: 'Repo must be in format "owner/repo"' };
    }
    
    if (!parsed.extra || parsed.extra.length === 0) {
      return { valid: false, error: 'Username required in extra data' };
    }
    
    // Try to decode username to validate it's properly encoded
    try {
      const extraHex = parsed.extra.startsWith('0x') ? parsed.extra.slice(2) : parsed.extra;
      const username = Buffer.from(extraHex, 'hex').toString('utf8').replace(/\0/g, '');
      
      if (!username) {
        return { valid: false, error: 'Could not decode username from extra data' };
      }
      
      // Basic GitHub username validation
      if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username)) {
        return { valid: false, error: `Invalid GitHub username format: ${username}` };
      }
      
    } catch {
      return { valid: false, error: 'Invalid username encoding in extra data' };
    }
    
    return { valid: true };
  },

  async execute(parsed: CogniActionParsed, octokit: Octokit, logger: Application['log']): Promise<ActionResult> {
    const { repo, executor } = parsed;
    
    // Decode username from extra bytes
    let username: string;
    try {
      const extraHex = parsed.extra.startsWith('0x') ? parsed.extra.slice(2) : parsed.extra;
      username = Buffer.from(extraHex, 'hex').toString('utf8').replace(/\0/g, '');
    } catch (error) {
      logger.error(`Failed to decode username from extra data: ${parsed.extra}`, { error });
      return { success: false, action: 'decode_failed', error: 'Invalid username encoding' };
    }
    
    logger.info(`Executing ${this.action} for repo=${repo}, username=${username}, executor=${executor}`);
    
    const result = await addAdmin(octokit, repo, username, executor);
    
    if (result.success) {
      logger.info(`Successfully added ${username} as admin to ${repo}`, { username, status: result.status });
      return { 
        success: true, 
        action: 'admin_added', 
        username, 
        permission: 'admin',
        repo
      };
    } else {
      logger.error(`Failed to add ${username} as admin to ${repo}`, { error: result.error, status: result.status });
      return { 
        success: false, 
        action: 'admin_add_failed', 
        error: result.error, 
        username,
        repo
      };
    }
  }
};