import { ActionHandler, CogniActionParsed, ValidationResult, ActionResult } from '../types';
import { removeAdmin } from '../../../services/github';
import { Octokit } from 'octokit';
import { Application } from 'probot';

export const removeAdminAction: ActionHandler = {
  action: "REMOVE_ADMIN",
  target: "repository",
  description: "Remove a user as repository admin via DAO vote",

  async validate(parsed: CogniActionParsed): Promise<ValidationResult> {
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
      
    } catch (error) {
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
    
    const result = await removeAdmin(octokit, repo, username, executor);
    
    if (result.success) {
      logger.info(`Successfully removed ${username} as admin from ${repo}`, { username, status: result.status });
      return { 
        success: true, 
        action: 'admin_removed', 
        username, 
        repo
      };
    } else {
      logger.error(`Failed to remove ${username} as admin from ${repo}`, { error: result.error, status: result.status });
      return { 
        success: false, 
        action: 'admin_remove_failed', 
        error: result.error, 
        username,
        repo
      };
    }
  }
};